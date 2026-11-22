import { setTimeout as delay } from "node:timers/promises";

const networkErrors = new Set([
    "MongoNetworkError", "MongoNetworkTimeoutError", "MongoServerSelectionError",
    "MongooseServerSelectionError"
]);

// Retry only network failures, without changing credentials or TLS validation.
export default async function connectWithRetry(connect, reset, {
    attempts = 3, delayMs = 1000, onRetry = () => {}
} = {}) {
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            return await connect();
        } catch (error) {
            await reset();
            if (!networkErrors.has(error.name) || attempt === attempts) throw error;
            onRetry(attempt, error.name);
            await delay(delayMs * attempt);
        }
    }
}
