const express = require("express");
const mongoose = require("mongoose");
const products = require("../controllers/productController");
const router = express.Router();

router.use((req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ message: "Product database is offline" });
    }
    next();
});

router.param("id", (req, res, next, id) => {
    if (!mongoose.isObjectIdOrHexString(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
    }
    next();
});

function validateFields(req, res, next) {
    const body = req.body;
    const fields = ["name", "category", "price"];
    if (!body || typeof body !== "object" || Array.isArray(body) ||
        !Object.keys(body).length || Object.keys(body).some(key => !fields.includes(key))) {
        return res.status(400).json({ message: "Send product fields as a JSON object" });
    }
    for (const key of ["name", "category"]) {
        if (key in body && (typeof body[key] !== "string" || !body[key].trim())) {
            return res.status(400).json({ message: key + " must contain text" });
        }
    }
    if ("price" in body && (!Number.isFinite(body.price) || body.price < 0)) {
        return res.status(400).json({ message: "Price must be a non-negative number" });
    }
    next();
}

router.post("/", validateFields, products.create);
router.get("/", products.list);
router.get("/:id", products.read);
router.patch("/:id", validateFields, products.update);
router.delete("/:id", products.remove);

router.use((error, req, res, next) => {
    if (error.name === "ValidationError") return res.status(400).json({ message: error.message });
    res.status(500).json({ message: "Product operation failed" });
});

module.exports = router;
