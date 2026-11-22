import express from "express";

import {
    registerUser,
    loginUser,
    getMe,
    getAllCustomers,
    updateCustomerPhone
} from "../controllers/authController.js";

import {
    protect,
    adminOnly
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Customer Registration
router.post("/register", registerUser);

// User Login
router.post("/login", loginUser);

// Verify Admin
router.get("/me", protect, adminOnly, getMe);
router.get("/customers", protect, adminOnly, getAllCustomers);

// UPDATE CUSTOMER PHONE (ADMIN ONLY)
router.put(
    "/customers/:id/phone",
    protect,
    adminOnly,
    updateCustomerPhone
);
export default router;