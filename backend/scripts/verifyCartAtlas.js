import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import mongoose from "mongoose";
import newman from "newman";
import connectWithRetry from "../config/connectWithRetry.js";

// No tokens, passwords, connection strings, or raw Newman reports are written.
const baseUrl = process.env.CART_TEST_BASE_URL || "http://localhost:5001";
const target = new URL(baseUrl);
assert(["localhost", "127.0.0.1", "[::1]"].includes(target.hostname), "Use a local backend");
const uri = new URL(process.env.MONGODB_URI);
assert.equal(uri.hostname, "mohitcluster.523klxy.mongodb.net", "Unexpected Atlas cluster");
assert.equal(decodeURIComponent(uri.pathname), "/sweet_treats_bakery", "Unexpected database");

const collection = JSON.parse(await readFile(new URL("../../postman/Cart.postman_collection.json", import.meta.url)));
const email = `cart-verification-${randomUUID()}@example.invalid`;
const password = randomBytes(24).toString("base64url") + "aA1!";
let environment = { values: [
    { key: "baseUrl", value: baseUrl, enabled: true },
    { key: "testEmail", value: email, enabled: true },
    { key: "testPassword", value: password, enabled: true }
] };
const makeClient = () => new mongoose.mongo.MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS:15000 });
let client = makeClient();
let db;
let requests = 0;
let assertions = 0;

function safeMessage(value) {
    let message = String(value || "");
    for (const secret of [password, process.env.MONGODB_URI, uri.username, uri.password,
        decodeURIComponent(uri.username), decodeURIComponent(uri.password), environment.get?.("token")]) {
        if (secret) message = message.split(secret).join("[REDACTED]");
    }
    return message.replace(/[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, "[REDACTED TOKEN]");
}

function runFolder(folder) {
    return new Promise((resolve, reject) => {
        newman.run({ collection, environment, folder, reporters: [], timeoutRequest:15000, bail:true }, (error, summary) => {
            if (error || !summary) return reject(new Error("Collection runner failed; no raw diagnostic exported"));
            environment = summary.environment;
            for (const execution of summary.run.executions) {
                requests++;
                console.log(`${execution.request.method} ${execution.item.name}: HTTP ${execution.response?.code ?? "NO RESPONSE"}`);
            }
            assertions += summary.run.stats.assertions.total;
            if (summary.run.failures.length) {
                for (const failure of summary.run.failures) console.error(`FAIL: ${failure.source?.name || "Collection assertion"}: ${safeMessage(failure.error?.message)}`);
                return reject(new Error("Collection assertions failed"));
            }
            resolve();
        });
    });
}

try {
    await connectWithRetry(() => client.connect(), async () => {
        await client.close();
        client = makeClient();
    }, { onRetry: attempt => console.log(`Atlas network preflight retry ${attempt}/2; no test data created yet`) });
    db = client.db("sweet_treats_bakery");
    await db.command({ ping:1 });
    const products = await db.collection("products").find({ isAvailable:true }).toArray();
    assert(products.length > 0, "No existing bakery products found");
    const response = await fetch(`${baseUrl}/api/products`);
    assert.equal(response.status, 200, "Products API failed");
    const api = await response.json();
    const projection = p => ({ id:String(p._id), name:p.name, variants:p.variants.map(v => ({label:v.label,price:v.price})) });
    const canonical = list => list.map(projection).sort((a,b) => a.id.localeCompare(b.id));
    assert.deepEqual(canonical(api.products), canonical(products), "API products differ from group Atlas products");
    console.log(`Atlas authenticated: sweet_treats_bakery; API matches ${products.length} existing available products`);

    await runFolder("01 Setup and persistence");
    const user = await db.collection("users").findOne({ email, role:"customer" });
    assert(user, "Test customer missing from group Atlas");
    const items = await db.collection("cartitems").find({ user:user._id }).toArray();
    assert.equal(items.length, 1, "Test cart was not persisted in Atlas");
    const item = items[0];
    assert.equal(String(item._id), environment.get("cartItemId"));
    assert.equal(String(item.productId), environment.get("productId"));
    assert.equal(item.qty, 1);
    assert.equal(item.price, Number(environment.get("unitPrice")));
    assert.equal(item.weight, environment.get("weight"));
    console.log(`Independent Atlas persistence: PASS (${item.name}, ${item.weight}, qty 1, price ${item.price})`);

    await runFolder("02 Update validation and removal");
    assert.equal(await db.collection("cartitems").countDocuments({ user:user._id }), 0, "Test cart still exists after removal");
    console.log("Independent Atlas removal: PASS (zero test cart records)");
    console.log(`Collection PASS: ${requests} requests, ${assertions} assertions`);
} catch (error) {
    console.error(`Verification FAILED (${error.name}${error.code ? `, code ${error.code}` : ""}): ${safeMessage(error.message)}`);
    process.exitCode = 1;
} finally {
    if (db) {
        try {
            const user = await db.collection("users").findOne({ email, role:"customer" });
            if (user) {
                // Exact run-owned customer only; never touch products or orders.
                const cart = await db.collection("cartitems").deleteMany({ user:user._id });
                const customer = await db.collection("users").deleteOne({ _id:user._id, email, role:"customer" });
                assert.equal(customer.deletedCount, 1);
                assert.equal(await db.collection("cartitems").countDocuments({ user:user._id }), 0);
                assert.equal(await db.collection("users").countDocuments({ _id:user._id }), 0);
                console.log(`Cleanup PASS: ${customer.deletedCount} temporary customer, ${cart.deletedCount} remaining test cart records removed`);
            }
        } catch {
            console.error(`Cleanup FAILED. Only this test email may need cleanup: ${email}`);
            process.exitCode = 1;
        }
    }
    await client.close();
}
