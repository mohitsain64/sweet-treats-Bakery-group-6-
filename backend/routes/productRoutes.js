import express from "express";

import {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
} from "../controllers/productController.js";

import {
    protect,
    adminOnly
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Public Routes
router.get("/", getProducts);
router.get("/:id", getProductById);

// Admin Only Routes
router.post("/", protect, adminOnly, createProduct);
router.put("/:id", protect, adminOnly, updateProduct);
router.delete("/:id", protect, adminOnly, deleteProduct);

export default router;