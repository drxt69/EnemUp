import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyWebhookSignature({
  body,
  signature,
  secret,
}: {
  body: string;
  signature: string | null;
  secret?: string;
}) {
  if (!secret) {
    return true;
  }

  if (!signature) {
    return false;
  }

  const expected = createHmac("sha256", secret).update(body).digest("hex");
  const received = signature.replace(/^sha256=/, "");

  if (expected.length !== received.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}
