import express from "express";
import cors from "cors";

// Create Express application
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Sweet Treats Bakery Backend is running!"
    });
});

export default app;