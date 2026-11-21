import "dotenv/config";
import app from "./app.js";
import connectDB from "./config/database.js";

const PORT = process.env.PORT || 5000;

// Start server after database connection
const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Bakery server running on port ${PORT}`);
        });

    } catch (error) {
        console.log("Server startup failed:", error.message);
    }
};

startServer();