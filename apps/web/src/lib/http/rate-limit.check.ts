// Run: node --experimental-strip-types src/lib/http/rate-limit.check.ts
import assert from "node:assert/strict";
// @ts-expect-error node strip-types needs the .ts extension; tsconfig doesn't allow it
import { rateLimit } from "./rate-limit.ts";

assert.equal(rateLimit("k", 2, 1000, 0).ok, true);
assert.equal(rateLimit("k", 2, 1000, 100).ok, true);
assert.deepEqual(rateLimit("k", 2, 1000, 200), { ok: false, retryAfterSeconds: 1 });
assert.equal(rateLimit("other", 2, 1000, 200).ok, true);
assert.equal(rateLimit("k", 2, 1000, 1001).ok, true); // oldest hit slid out
console.log("rate-limit ok");
