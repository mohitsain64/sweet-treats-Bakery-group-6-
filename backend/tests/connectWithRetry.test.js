import test from "node:test";
import assert from "node:assert/strict";
import connectWithRetry from "../config/connectWithRetry.js";

test("recovers from a transient network error after resetting the connection", async () => {
    let calls = 0, resets = 0;
    const result = await connectWithRetry(async () => {
        if (++calls === 1) throw Object.assign(new Error(), { name:"MongoNetworkError" });
        return "connected";
    }, async () => { resets++; }, { delayMs:0 });
    assert.equal(result, "connected");
    assert.equal(calls, 2);
    assert.equal(resets, 1);
});

test("does not retry rejected authentication", async () => {
    let calls = 0;
    const error = Object.assign(new Error(), { name:"MongoServerError", code:8000 });
    await assert.rejects(connectWithRetry(async () => { calls++; throw error; }, async () => {}, { delayMs:0 }), e => e === error);
    assert.equal(calls, 1);
});

test("stops after three network failures", async () => {
    let calls = 0, resets = 0;
    const error = Object.assign(new Error(), { name:"MongoNetworkError" });
    await assert.rejects(connectWithRetry(async () => { calls++; throw error; }, async () => { resets++; }, { delayMs:0 }), e => e === error);
    assert.equal(calls, 3);
    assert.equal(resets, 3);
});
