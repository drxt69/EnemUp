import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { checkRateLimit } from "../src/lib/security/rate-limit";
import { verifyWebhookSignature } from "../src/lib/security/webhook";

test("rate limiter blocks after configured limit", () => {
  const key = `test:${Date.now()}:${Math.random()}`;

  assert.equal(checkRateLimit(key, 2, 60_000).allowed, true);
  assert.equal(checkRateLimit(key, 2, 60_000).allowed, true);
  assert.equal(checkRateLimit(key, 2, 60_000).allowed, false);
});

test("webhook signature validates matching payload", () => {
  const body = JSON.stringify({ id: "123", type: "payment" });
  const secret = "local-secret";
  const signature = createHmac("sha256", secret).update(body).digest("hex");

  assert.equal(
    verifyWebhookSignature({ body, signature: `sha256=${signature}`, secret }),
    true,
  );
});

test("webhook signature rejects invalid payload", () => {
  assert.equal(
    verifyWebhookSignature({
      body: "{}",
      signature: "sha256=invalid",
      secret: "local-secret",
    }),
    false,
  );
});
