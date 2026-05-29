import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const createOrder = asyncHandler(async(req,res)=>{
    // items and payment provider

    const {items, paymentProvider} = req.body

    if(!items || !Array.isArray(items) || items.length === 0) {
        throw new ApiError(400, 'Order items are required')
    }

    if(!["razorpay", "stripe"].includes(paymentProvider)) {
        throw new ApiError(400, "Invalid payment provider")
    }

    // set amount and items in cart
    let totalAmount=0
    const processedItems = []

    for(const item of items) {
        if(!mongoose.Types.ObjectId.isValid(item.product)) {
            throw new ApiError(400, "Invalid product ID")
        }

        const product = await Product.findById(item.product)

        if(!product || !product.isActive) {
            throw new ApiError(404, 'Product not available')
        }

        // set price, quantity
        const priceAtPurchase = product.price
        const quantity = Number(item.quantity ?? 1)

        if(!Number.isFinite(quantity) || quantity <= 0) {
            throw new ApiError(400, "Invalid quantity")
        }
        
        totalAmount += priceAtPurchase*quantity

        processedItems.push({
            product:product._id,
            quantity:quantity,
            priceAtPurchase:priceAtPurchase,
        })
    }

    // create order
    const order = await Order.create({
        user:req.user._id,
        items:processedItems,
        totalAmount:totalAmount,
        paymentProvider:paymentProvider,
        paymentStatus:'pending',
        orderStatus:'created'
    })

    // return res
    return res.status(201)
    .json(
        new ApiResponse(
            201,
            order,
            'Order created successfully'
        )
    )
})

export {createOrder}