import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      lowercase: true,
      default: "colour-preset",
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number, // smallest currency unit (paise)
      required: true,
    },
    images: [
      {
        type: String,
        required: true,
      },
    ],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isDigital: {
      type: Boolean,
      default: true,
    },
    downloadUrl: {
      type: String, // protected / signed URL // cloudinary
    },
    stock: {
      type: Number,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Indexes for query optimization
productSchema.index({ isActive: 1, category: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ owner: 1 });

export const Product = mongoose.model("Product", productSchema);
