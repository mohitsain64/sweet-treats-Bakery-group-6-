import mongoose from "mongoose";

// Define cake product structure
const productSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        default: ""
    },

    category: {
        type: [String],
        required: true
    },

    image: {
        type: String,
        required: true
    },

    badge: {
        type: String,
        default: ""
    },

    // Different cake sizes and their prices
    variants: [{
        label: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        oldPrice: {
            type: Number,
            default: null
        }
    }],

    rating: {
        type: Number,
        default: 0
    },

    reviewCount: {
        type: Number,
        default: 0
    },

    isAvailable: {
        type: Boolean,
        default: true
    }

}, { timestamps: true });

// Create Product model
const Product = mongoose.model("Product", productSchema);

export default Product;