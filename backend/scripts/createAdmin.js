import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import connectDB from "../config/database.js";

const createAdmin = async () => {
    try {
        const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

        if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
            throw new Error("Admin environment variables are missing.");
        }

        if (ADMIN_PASSWORD.length > 6) {
            throw new Error("Admin password must be maximum 6 characters.");
        }

        await connectDB();

        const existingUser = await User.findOne({
            email: ADMIN_EMAIL.toLowerCase()
        });

        if (existingUser) {
            throw new Error("This email already exists. No role was changed.");
        }

        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

        await User.create({
            name: ADMIN_NAME,
            email: ADMIN_EMAIL,
            password: hashedPassword,
            role: "admin"
        });

        console.log("Admin account created successfully!");

    } catch (error) {
        console.error("Admin creation failed:", error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

createAdmin();