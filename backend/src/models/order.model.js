import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2"
const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: Number,
        priceAtPurchase: Number,
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
    },

    paymentProvider: {
      type: String,
      enum: ["razorpay", "stripe"],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },

    orderStatus: {
      type: String,
      enum: ["created", "completed", "cancelled"],
      default: "created",
    },

    // Provider references (optional)
    razorpayOrderId: String,
    stripePaymentIntentId: String,

    // Email idempotency flags
    customerPaidEmailSentAt: Date,
    adminPaidEmailSentAt: Date,
  },
  { timestamps: true }
);

orderSchema.plugin(mongoosePaginate)

// Indexes for fast lookups
orderSchema.index({ user: 1, paymentStatus: 1 });
orderSchema.index({ razorpayOrderId: 1 });
orderSchema.index({ createdAt: -1 });

export const Order = mongoose.model("Order", orderSchema);
