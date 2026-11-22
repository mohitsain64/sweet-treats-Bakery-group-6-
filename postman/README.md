# Cart API verification

Import [Cart.postman_collection.json](./Cart.postman_collection.json) into Postman. Default `baseUrl` is `http://localhost:5001` (Mac AirPlay occupies port 5000).

The collection registers and logs in a unique temporary customer, reads existing products, and tests cart add/read/update/remove, stale updates, invalid quantities/variants/IDs, and unauthenticated access. It never submits an order or modifies existing customers/products.

For the verified workflow with independent Atlas checks and automatic cleanup, start the actual backend and run from `backend`:

```sh
npm ci
npm test
PORT=5001 npm start
# In another terminal, also from backend:
npm run test:cart:atlas
```

The runner requires the existing local `backend/.env` with the group Atlas URI targeting `sweet_treats_bakery`. It checks API product IDs/names/prices against Atlas, runs both collection folders, verifies the cart directly in Atlas between them, verifies removal, and deletes only its unique temporary customer/cart in a `finally` block. Output contains status codes and assertions, never credentials or tokens. A failed assertion or cleanup returns a nonzero exit status.

In Postman UI, run the complete collection in order using a fresh temporary environment. The first request generates test credentials and captures the token at runtime. Do not export the populated environment or raw run responses. A UI-only run cannot delete the temporary customer because the backend has no customer-deletion route; use the Node runner for automatic cleanup. The runner does not write an environment or raw report to disk.

Newman is a development-only dependency. The installed version's transitive dependencies have npm audit advisories; no forced downgrade or unrelated dependency rewrite is included here. Use only this trusted collection and do not publish raw run artifacts.

## Verified run — 22 November 2026

Executed the collection through Newman with Node 22.23.5 against the actual backend at `http://localhost:5001`, using group Atlas database `sweet_treats_bakery`: **16 requests, 31 assertions, zero failures**.

| Request/check | Actual result |
| --- | --- |
| Register isolated customer | 201 |
| Login as that customer | 200 |
| Read products | 200; all 31 available products matched Atlas IDs, names and variant prices |
| Read initial cart | 200; empty |
| Add existing Apple Cinnamon Tart, 6 Inch | 200; quantity 1, unit price 579 |
| Read cart | 200; expected customer, product, quantity, price and variant |
| Independent Atlas read | Exactly one matching test cart record persisted |
| Update quantity to 2 | 200 |
| Read updated cart | 200; quantity 2 and unchanged unit price |
| Stale quantity update | 409 |
| Zero quantity | 400 |
| Unavailable variant | 400 |
| Malformed cart item ID | 400 |
| Unauthenticated cart read | 401 |
| Read after rejected requests | 200; cart unchanged |
| Delete cart item | 204; empty response |
| Read after deletion | 200; empty cart |
| Independent Atlas deletion check | Zero test cart records |
| Cleanup | Temporary customer deleted; zero remaining test cart records |

Browser integration was also checked with a separate temporary customer: UI login, menu add, refresh persistence, increase/decrease quantity, minimum quantity protection, removal, and empty-cart checkout hiding all passed. Apple Cinnamon Tart (6 Inch), quantity 2, matched the cart and checkout total of ₹1,158 and an independent Atlas read. A homepage Red Velvet Dream Cake (0.5 kg) add also matched the displayed and backend price of ₹550. The temporary customer and its cart were cleaned up.

No order was submitted. Existing group customers, products and orders were not modified. A pre-existing catalog gap remains outside this change: the homepage lists Chocolate Ganache Tart, but the group products API did not include it. No product was created to fill that gap.

The startup code now reports port-binding errors correctly. The occupied-port check returned `EADDRINUSE` and exit status 1, without a false success message. Three focused connection tests passed: transient recovery, authentication fail-fast, and a maximum of three network attempts. TLS verification remains enabled. Intermittent Atlas TLS failures were observed before the passing run; their upstream cause was not established, and bounded retries are not a guarantee against a future network outage.
