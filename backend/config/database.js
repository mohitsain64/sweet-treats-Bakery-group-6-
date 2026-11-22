import mongoose from "mongoose";
import dns from "node:dns";
import connectWithRetry from "./connectWithRetry.js";

// Fix MongoDB DNS lookup issue
dns.setServers(["8.8.8.8", "8.8.4.4"]);

// Connect to MongoDB Atlas
const connectDB = async () => {
    await connectWithRetry(
        () => mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 }),
        () => mongoose.disconnect(),
        { onRetry: attempt => console.warn(`MongoDB network connection failed; retry ${attempt}/2`) }
    );
    console.log("MongoDB Connected Successfully!");
};

export default connectDB;
