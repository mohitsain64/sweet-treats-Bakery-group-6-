import Product from "../models/Product.js";

// Get all available cakes
export const getProducts = async (req, res) => {
    try {
        const { category, search } = req.query;

        let filter = { isAvailable: true };

        // Filter by category
        if (category && category !== "all") {
            filter.category = category;
        }

        // Search by cake name
        if (search) {
            filter.name = {
                $regex: search,
                $options: "i"
            };
        }

        const products = await Product.find(filter).sort({
            createdAt: -1
        });

        res.status(200).json({
            success: true,
            count: products.length,
            products
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Get single cake by ID
export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Cake not found"
            });
        }

        res.status(200).json({
            success: true,
            product
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Add new cake
export const createProduct = async (req, res) => {
    try {
        const product = await Product.create(req.body);

        res.status(201).json({
            success: true,
            message: "Cake added successfully",
            product
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// Update cake details
export const updateProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Cake not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Cake updated successfully",
            product
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// Delete cake
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Cake not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Cake deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};