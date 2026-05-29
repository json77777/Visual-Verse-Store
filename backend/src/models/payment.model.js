import mongoose from "mongoose"
import mongoosePaginate from "mongoose-paginate-v2"

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    provider: {
      type: String,
      enum: ["razorpay", "stripe"],
      required: true,
    },

    providerPaymentId: {
      type: String, // razorpay_payment_id OR stripe_charge_id
      required: true,
    },

    providerIntentId: {
      type: String, // stripe payment_intent
    },

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "INR",
    },

    status: {
      type: String,
      enum: ["created", "success", "failed"],
      required: true,
    },
  },
  { timestamps: true }
);
paymentSchema.plugin(mongoosePaginate)
export const Payment = mongoose.model("Payment", paymentSchema);
