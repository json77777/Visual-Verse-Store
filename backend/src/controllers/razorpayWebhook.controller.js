import crypto from "crypto"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { env } from "../config/env.js"
import { Order } from "../models/order.model.js"
import { Payment } from "../models/payment.model.js"
import { User } from "../models/user.model.js"
import { emailTemplates, sendEmail } from "../utils/email.js"


const razorpayWebhook = asyncHandler(async(req,res)=>{
    // verify razorpay signature
    const razorpaySignature = req.headers['x-razorpay-signature']

    if(!razorpaySignature) {
        throw new ApiError(400, "Missing Razorpay signature")
    }

    // verify signature by raw body
    const expextedSignature = crypto
    .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
    .update(req.body)
    .digest('hex')

    if(razorpaySignature !== expextedSignature) {
        throw new ApiError(400, "Invalid Razorpay signature")
    }

    // parse webhook payload
    const event = JSON.parse(req.body.toString())

    if (event.event !== "payment.captured") {
        return res.status(200).json(
            new ApiResponse(200, {}, "Event ignored")
        )
    }

    const paymentEntity = event.payload.payment.entity

    const razorpayOrderId = paymentEntity.order_id
    const razorpayPaymentId = paymentEntity.id
    const amount = paymentEntity.amount
    const currency = paymentEntity.currency

    // find internal order'
    const order = await Order.findOne({razorpayOrderId}).populate("items.product")

    if(!order) {
        throw new ApiError(404, "Order not found for Razorpay order ID")
    }

    // Idempotency check (important)
    const existingPayment = await Payment.findOne({
        providerPaymentId: razorpayPaymentId,
    })

    if(existingPayment) {
       return res.status(200).json(
            new ApiResponse(200, {}, "Payment already processed")
       ) 
    }

    // Create payment record
    await Payment.create({
        user: order.user,
        order: order._id,
        provider: "razorpay",
        providerPaymentId: razorpayPaymentId,
        amount,
        currency,
        status: "success",
    })

    //  Mark order as completed after payment
    order.paymentStatus = "paid"
    order.orderStatus = "completed"

    // Send emails (idempotent). Never fail the webhook response if email fails.
    try {
        const user = await User.findById(order.user)

        if (user?.email && !order.customerPaidEmailSentAt) {
            const products = (order.items ?? [])
              .map((it) => ({
                ...(it.product?.toObject?.() ?? it.product ?? {}),
                __qty: it.quantity ?? 1,
              }))
              .filter((p) => p && p.title)

            const tpl = emailTemplates.orderPaidCustomer({ order, user, products })
            await sendEmail({
                to: user.email,
                subject: tpl.subject,
                text: tpl.text,
                html: tpl.html,
            })
            order.customerPaidEmailSentAt = new Date()
        }

        if (env.ADMIN_NOTIFICATION_EMAIL && !order.adminPaidEmailSentAt) {
            const tpl = emailTemplates.orderPaidAdmin({ order, user })
            await sendEmail({
                to: env.ADMIN_NOTIFICATION_EMAIL,
                subject: tpl.subject,
                text: tpl.text,
                html: tpl.html,
            })
            order.adminPaidEmailSentAt = new Date()
        }
    } catch (e) {
        if (env.NODE_ENV !== "production") {
            console.error("[EMAIL] Failed to send paid-order email(s):", e)
        }
    }

    await order.save()

    return res.status(200).json(
        new ApiResponse(200, {}, "Payment verified and order completed")
    )
})

export {razorpayWebhook}