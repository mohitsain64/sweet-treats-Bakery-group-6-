import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    weight: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, min: 1, required: true }
}, { timestamps: true });

cartItemSchema.index({ user: 1, productId: 1, weight: 1 }, { unique: true });

export default mongoose.model("CartItem", cartItemSchema);
