import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import productRoutes from "./routes/productRoutes.js";

const app = express();

// Get project root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.resolve(__dirname, "..");

// Middleware
app.use(cors());
app.use(express.json());

// Product API
app.use("/api/products", productRoutes);

// Block private project folders and files
app.use((req, res, next) => {
    const blocked = /^\/(backend|data|node_modules|\.git)(\/|$)/i.test(req.path)
        || /^\/(package(-lock)?\.json|\.env)/i.test(req.path);

    if (blocked) {
        return res.sendStatus(404);
    }

    next();
});

// Serve frontend files
app.use(express.static(frontendPath));

// Home route
app.get("/", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});

export default app;