import dns from "node:dns";
import "dotenv/config";
import mongoose from "mongoose";
import { load } from "cheerio";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import Product from "../models/Product.js";
// Fix MongoDB DNS lookup issue
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read original menu.html from project root
const menuPath = path.resolve(__dirname, "../../menu.html");

// Original website weight multipliers
const weightMultiplier = {
    "0.5 kg": 0.5,
    "500g": 0.5,
    "1 kg": 1,
    "1.5 kg": 1.5,
    "2 kg": 2,
    "6 Inch": 1,
    "8 Inch": 1.5,
    "1 Piece": 1,
    "1 Pc": 1,
    "Box of 2": 2,
    "Box of 3": 3,
    "Box of 4": 4,
    "Box of 6": 6
};

// Extract numeric price
function getPrice(text) {
    return Number(text.replace(/[₹,]/g, "").trim());
}

const migrateProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB Connected!");

        const html = fs.readFileSync(menuPath, "utf-8");
        const $ = load(html);

        const cards = $(".product-card");
        let count = 0;

        for (const element of cards.toArray()) {
            const card = $(element);

            const name = card.find(".product-title").text().trim();
            const image = card.find("img").attr("src");
            const category = (card.attr("data-category") || "")
                .split(" ")
                .filter(Boolean);

            const badge = card.find(".card-tag").text().trim();

            const rating = Number(
                card.find(".rating-row strong").text().trim()
            ) || 0;

            const reviewText = card.find(".rating-row").text();
            const reviewCount = Number(
                reviewText.match(/\((\d+)\)/)?.[1] || 0
            );

            const currentPrice = getPrice(
                card.find(".current-price").text()
            );

            const oldPriceText = card.find(".old-price").text();
            const oldPrice = oldPriceText
                ? getPrice(oldPriceText)
                : null;

            const activeWeight = card.find(".weight-btn.active").text().trim();

            const multiplier = weightMultiplier[activeWeight] || 1;

            const basePrice = currentPrice / multiplier;
            const baseOldPrice = oldPrice
                ? oldPrice / multiplier
                : null;

            const variants = [];

            card.find(".weight-btn").each((index, button) => {
                const label = $(button).text().trim();
                const variantMultiplier = weightMultiplier[label] || 1;

                variants.push({
                    label,
                    price: Math.round(basePrice * variantMultiplier),
                    oldPrice: baseOldPrice
                        ? Math.round(baseOldPrice * variantMultiplier)
                        : null
                });
            });

            const productData = {
                name,
                description: "",
                image,
                category,
                badge,
                variants,
                rating,
                reviewCount,
                isAvailable: true
            };

            // Update existing product or insert new product
            await Product.updateOne(
                { name },
                { $set: productData },
                { upsert: true, runValidators: true }
            );

            count++;
            console.log(`Migrated: ${name}`);
        }

        console.log(`\nMigration completed! ${count} cakes processed.`);

    } catch (error) {
        console.error("Migration failed:", error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

migrateProducts();