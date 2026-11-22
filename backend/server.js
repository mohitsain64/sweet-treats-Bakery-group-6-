import "dotenv/config";
import mongoose from "mongoose";
import app from "./app.js";
import connectDB from "./config/database.js";

const PORT = process.env.PORT || 5000;

// Start server after database connection
const startServer = async () => {
    try {
        await connectDB();

        await new Promise((resolve, reject) => {
            app.listen(PORT, error => error ? reject(error) : resolve());
        });
        console.log(`Bakery server running on port ${PORT}`);

    } catch (error) {
        console.error("Server startup failed:", error.code || error.name);
        await mongoose.disconnect();
        process.exitCode = 1;
    }
};

startServer();
