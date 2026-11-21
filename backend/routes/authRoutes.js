import express from "express";

import {
    registerUser,
    loginUser,
    getMe
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

export default router;