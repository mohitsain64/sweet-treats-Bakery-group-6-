import Order from "../models/Order.js";
import Product from "../models/Product.js";

// CREATE NEW ORDER
export const createOrder = async (req, res) => {
    try {
        const { customer, items, address, paymentMethod } = req.body;

        if (!customer || !items || items.length === 0 || !address) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required details."
            });
        }

        let totalAmount = 0;
        const orderItems = [];

        for (const item of items) {
            const product = await Product.findById(item.productId);

            if (!product || !product.isAvailable) {
                return res.status(400).json({
                    success: false,
                    message: "Product is unavailable."
                });
            }

            const variant = product.variants.find(
                v => v.label === item.variant
            );

            if (!variant) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid product variant."
                });
            }

            const quantity = Number(item.quantity);

            if (!Number.isInteger(quantity) || quantity < 1) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid quantity."
                });
            }

            totalAmount += variant.price * quantity;

            orderItems.push({
                productId: product._id,
                name: product.name,
                image: product.image,
                variant: variant.label,
                quantity,
                price: variant.price
            });
        }

        const order = await Order.create({
            customer,
            items: orderItems,
            totalAmount,
            address,
            paymentMethod: paymentMethod || "COD"
        });

        res.status(201).json({
            success: true,
            message: "Order placed successfully!",
            order
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// GET ALL ORDERS (ADMIN)
export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            totalOrders: orders.length,
            orders
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// UPDATE ORDER STATUS (ADMIN)
export const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const allowedStatuses = [
            "Pending",
            "Confirmed",
            "Preparing",
            "Out for Delivery",
            "Delivered",
            "Cancelled"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order status."
            });
        }

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found."
            });
        }

        order.orderStatus = status;
        await order.save();

        res.status(200).json({
            success: true,
            message: "Order status updated successfully!",
            order
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};