import mongoose from "mongoose";
import dns from "node:dns";

// Fix MongoDB DNS lookup issue
dns.setServers(["8.8.8.8", "8.8.4.4"]);

// Connect to MongoDB Atlas
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB Connected Successfully!");
    } catch (error) {
        console.log("MongoDB Connection Failed:", error.message);
        process.exit(1);
    }
};

export default connectDB;