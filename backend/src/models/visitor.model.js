import mongoose from "mongoose";

const visitorSchema = new mongoose.Schema({
    visitorId: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    lastActiveAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

export const Visitor = mongoose.model("Visitor", visitorSchema);
