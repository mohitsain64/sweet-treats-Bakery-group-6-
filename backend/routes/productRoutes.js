import express from "express";

import {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
} from "../controllers/productController.js";

const router = express.Router();

// Get all cakes
router.get("/", getProducts);

// Get single cake
router.get("/:id", getProductById);

// Add new cake
router.post("/", createProduct);

// Update cake
router.put("/:id", updateProduct);

// Delete cake
router.delete("/:id", deleteProduct);

export default router;