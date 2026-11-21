import express from "express";

import {
    createOrder,
    getAllOrders,
    updateOrderStatus
} from "../controllers/orderController.js";

import {
    protect,
    adminOnly
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Customer: Place New Order
router.post("/", createOrder);

// Admin: Get All Orders
router.get("/", protect, adminOnly, getAllOrders);

// Admin: Update Order Status
router.put("/:id/status", protect, adminOnly, updateOrderStatus);

export default router;