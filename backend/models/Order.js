import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({

    customer: {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        }
    },

    items: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product"
            },
            name: {
                type: String,
                required: true
            },
            image: String,
            variant: String,
            quantity: {
                type: Number,
                required: true,
                min: 1
            },
            price: {
                type: Number,
                required: true
            }
        }
    ],

    totalAmount: {
        type: Number,
        required: true
    },

    address: {
        type: String,
        required: true
    },

    paymentMethod: {
        type: String,
        default: "COD"
    },

    paymentStatus: {
        type: String,
        enum: ["Pending", "Paid", "Failed"],
        default: "Pending"
    },

    orderStatus: {
        type: String,
        enum: ["Pending", "Confirmed", "Preparing", "Out for Delivery", "Delivered", "Cancelled"],
        default: "Pending"
    }

}, {
    timestamps: true
});

const Order = mongoose.model("Order", orderSchema);

export default Order;