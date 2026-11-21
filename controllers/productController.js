const Product = require("../models/Product");

exports.create = async (req, res) => {
    const product = await Product.create(req.body);
    res.status(201).json(product);
};

exports.list = async (req, res) => {
    res.json(await Product.find().sort({ name: 1 }));
};

exports.read = async (req, res) => {
    const product = await Product.findById(req.params.id);
    sendProduct(res, product);
};

exports.update = async (req, res) => {
    const product = await Product.findByIdAndUpdate(req.params.id,
        { $set: req.body }, { new: true, runValidators: true });
    sendProduct(res, product);
};

exports.remove = async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    sendProduct(res, product);
};

function sendProduct(res, product) {
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
}
