import express from "express";
import mongoose from "mongoose";
import CartItem from "../models/CartItem.js";
import Product from "../models/Product.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

router.get("/", async (req, res) => {
    const items = await CartItem.find({ user: req.user._id }).sort({ _id: 1 });
    res.json({ items });
});

router.post("/", async (req, res) => {
    const { productId, weight, qty = 1, importLegacy = false } = req.body ?? {};
    if (!mongoose.isObjectIdOrHexString(productId) || !Number.isSafeInteger(qty) || qty < 1) {
        return res.status(400).json({ message: "Invalid product or quantity." });
    }
    const product = await Product.findById(productId);
    const variant = product?.variants.find(entry => entry.label === weight);
    if (!product?.isAvailable || !variant) {
        return res.status(400).json({ message: "This product or size is unavailable." });
    }
    const key = { user: req.user._id, productId: product._id, weight };
    const update = {
        $set: { name: product.name, image: product.image, price: variant.price },
        ...(importLegacy === true ? { $max: { qty } } : { $inc: { qty } })
    };
    await CartItem.findOneAndUpdate(key, update, { upsert: true });
    res.status(200).json({ success: true });
});

router.param("id", (req, res, next, id) => {
    if (!mongoose.isObjectIdOrHexString(id)) {
        return res.status(400).json({ message: "Invalid cart item." });
    }
    next();
});

router.patch("/:id", async (req, res) => {
    const { qty, previousQty } = req.body ?? {};
    if (!Number.isSafeInteger(qty) || qty < 1) {
        return res.status(400).json({ message: "Quantity must be a positive whole number." });
    }
    const filter = { _id: req.params.id, user: req.user._id };
    if (previousQty !== undefined) {
        if (!Number.isSafeInteger(previousQty) || previousQty < 1) {
            return res.status(400).json({ message: "Invalid previous quantity." });
        }
        filter.qty = previousQty;
    }
    const item = await CartItem.findOneAndUpdate(filter, { $set: { qty } }, { new: true });
    if (!item) return res.status(409).json({ message: "Cart changed. Please try again." });
    res.json({ success: true });
});

router.delete("/:id", async (req, res) => {
    const filter = { _id: req.params.id, user: req.user._id };
    // Checkout only clears lines that still match the submitted cart.
    if (req.query.version) {
        const version = new Date(req.query.version);
        if (!Number.isFinite(version.getTime())) return res.sendStatus(400);
        filter.updatedAt = version;
    }
    await CartItem.deleteOne(filter);
    res.sendStatus(204);
});

router.use((error, req, res, next) => {
    res.status(500).json({ message: "Unable to access your cart. Please try again." });
});

export default router;
