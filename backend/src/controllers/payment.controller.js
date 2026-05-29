import crypto from "crypto"

import { env } from "../config/env.js"
import { Order } from "../models/order.model.js"
import { Payment } from "../models/payment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { razorpay } from "../utils/razorpay.js"
import { User } from "../models/user.model.js"
import { emailTemplates, sendEmail } from "../utils/email.js"

const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body

  if (!orderId) {
    throw new ApiError(400, "Order ID is required")
  }

  const order = await Order.findById(orderId)

  if (!order) {
    throw new ApiError(404, "Order not found")
  }

  if (String(order.user) !== String(req.user?._id)) {
    throw new ApiError(403, "You cannot pay for another user's order")
  }

  if (order.paymentStatus === "paid") {
    throw new ApiError(400, "Order already paid")
  }
  // If order total is zero (free items), skip creating a Razorpay order
  if (!order.totalAmount || order.totalAmount === 0) {
    order.paymentStatus = "paid"
    order.orderStatus = "completed"

    try {
      const user = await User.findById(order.user)

      if (user?.email && !order.customerPaidEmailSentAt) {
        const populatedOrder = await Order.findById(order._id).populate("items.product")
        const products = (populatedOrder?.items ?? [])
          .map((it) => ({
            ...(it.product?.toObject?.() ?? it.product ?? {}),
            __qty: it.quantity ?? 1,
          }))
          .filter((p) => p && p.title)

        const tpl = emailTemplates.orderPaidCustomer({ order: populatedOrder ?? order, user, products })
        await sendEmail({ to: user.email, subject: tpl.subject, text: tpl.text, html: tpl.html })
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
      new ApiResponse(
        200,
        {
          razorpayOrderId: null,
          amount: 0,
          currency: "INR",
          key: env.RAZORPAY_KEY_ID,
        },
        "Order completed (no payment required)"
      )
    )
  }

  const razorpayOrder = await razorpay.orders.create({
    amount: order.totalAmount,
    currency: "INR",
    receipt: `order_${order._id}`,
    notes: {
      internalOrderId: String(order._id),
      userId: String(req.user?._id ?? ""),
    },
  })

  order.razorpayOrderId = razorpayOrder.id
  await order.save()

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: env.RAZORPAY_KEY_ID,
      },
      "Razorpay order created"
    )
  )
})

const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body ?? {}

  if (!orderId) {
    throw new ApiError(400, "Order ID is required")
  }

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new ApiError(400, "Missing Razorpay payment verification fields")
  }

  const order = await Order.findById(orderId)
  if (!order) {
    throw new ApiError(404, "Order not found")
  }

  if (String(order.user) !== String(req.user?._id)) {
    throw new ApiError(403, "You cannot verify another user's order")
  }

  if (order.paymentProvider !== "razorpay") {
    throw new ApiError(400, "Order payment provider is not Razorpay")
  }

  if (!order.razorpayOrderId) {
    throw new ApiError(400, "Razorpay order is not initialized")
  }

  if (order.razorpayOrderId !== razorpay_order_id) {
    throw new ApiError(400, "Razorpay order ID mismatch")
  }

  // Signature verification: HMAC_SHA256(order_id|payment_id, key_secret)
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex")

  if (expected !== razorpay_signature) {
    throw new ApiError(400, "Invalid Razorpay signature")
  }

  // Idempotency check
  const existingPayment = await Payment.findOne({
    provider: "razorpay",
    providerPaymentId: razorpay_payment_id,
  })

  if (!existingPayment) {
    await Payment.create({
      user: order.user,
      order: order._id,
      provider: "razorpay",
      providerPaymentId: razorpay_payment_id,
      amount: order.totalAmount,
      currency: "INR",
      status: "success",
    })
  }

  // Mark order as paid (webhook will be idempotent and won't duplicate payment)
  order.paymentStatus = "paid"
  order.orderStatus = "completed"

  // Email fallback: send receipt/notification here too (idempotent flags prevent duplicates).
  try {
    const user = await User.findById(order.user)

    if (user?.email && !order.customerPaidEmailSentAt) {
      const populatedOrder = await Order.findById(order._id).populate("items.product")
      const products = (populatedOrder?.items ?? [])
        .map((it) => ({
          ...(it.product?.toObject?.() ?? it.product ?? {}),
          __qty: it.quantity ?? 1,
        }))
        .filter((p) => p && p.title)

      const tpl = emailTemplates.orderPaidCustomer({ order: populatedOrder ?? order, user, products })
      await sendEmail({ to: user.email, subject: tpl.subject, text: tpl.text, html: tpl.html })
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
    new ApiResponse(
      200,
      {
        orderId: String(order._id),
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
      },
      "Payment verified"
    )
  )
})

export { createRazorpayOrder, verifyRazorpayPayment }
