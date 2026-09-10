import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/security/webhook";

type WebhookPayload = Record<string, unknown>;

function getString(payload: WebhookPayload, keys: string[]) {
  for (const key of keys) {
    const value = payload[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return null;
}

function getNestedString(payload: WebhookPayload, paths: string[][]) {
  for (const path of paths) {
    let current: unknown = payload;

    for (const key of path) {
      if (!current || typeof current !== "object" || !(key in current)) {
        current = null;
        break;
      }

      current = (current as WebhookPayload)[key];
    }

    if (typeof current === "string" && current.trim()) {
      return current.trim();
    }

    if (typeof current === "number") {
      return String(current);
    }
  }

  return null;
}

function getPaymentStatus(payload: WebhookPayload) {
  const status = getString(payload, ["status", "payment_status", "paymentStatus", "event"]);
  const eventType = getString(payload, ["type", "event_type", "eventType"]);

  return `${status ?? ""} ${eventType ?? ""}`.toLowerCase();
}

function isApprovedPayment(payload: WebhookPayload) {
  const status = getPaymentStatus(payload);

  return [
    "approved",
    "paid",
    "completed",
    "confirmed",
    "success",
    "authorized",
    "payment_approved",
    "payment.paid",
  ].some((term) => status.includes(term));
}

function getProviderPaymentId(payload: WebhookPayload) {
  return (
    getString(payload, [
      "id",
      "payment_id",
      "paymentId",
      "transaction_id",
      "transactionId",
      "order_id",
      "orderId",
      "charge_id",
      "chargeId",
    ]) ??
    getNestedString(payload, [
      ["payment", "id"],
      ["transaction", "id"],
      ["order", "id"],
      ["charge", "id"],
      ["data", "id"],
      ["data", "payment_id"],
    ])
  );
}

function getPayerEmail(payload: WebhookPayload) {
  return (
    getString(payload, [
      "email",
      "payer_email",
      "payerEmail",
      "customer_email",
      "customerEmail",
      "buyer_email",
      "buyerEmail",
    ]) ??
    getNestedString(payload, [
      ["customer", "email"],
      ["payer", "email"],
      ["buyer", "email"],
      ["client", "email"],
      ["data", "email"],
      ["data", "customer", "email"],
      ["data", "payer", "email"],
      ["data", "buyer", "email"],
    ])
  )?.toLowerCase();
}

async function activateRelatedPayment(payload: WebhookPayload) {
  if (!isApprovedPayment(payload)) {
    return;
  }

  const providerPaymentId = getProviderPaymentId(payload);
  const payerEmail = getPayerEmail(payload);

  if (!providerPaymentId && !payerEmail) {
    return;
  }

  const payment =
    providerPaymentId
      ? await prisma.payment.findFirst({
          where: {
            provider: "INFINITEPAY",
            providerPaymentId,
          },
          include: {
            subscription: true,
          },
        })
      : null;
  const paymentByEmail =
    payment ??
    (payerEmail
      ? await prisma.payment.findFirst({
          where: {
            provider: "INFINITEPAY",
            status: "PENDING",
            user: { email: payerEmail },
          },
          include: {
            subscription: true,
          },
          orderBy: { createdAt: "desc" },
        })
      : null);

  if (!paymentByEmail) {
    return;
  }

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: paymentByEmail.id },
      data: {
        status: "PAID",
        paidAt: new Date(),
        providerPaymentId: providerPaymentId ?? paymentByEmail.providerPaymentId,
        metadata: JSON.stringify(payload),
      },
    }),
    ...(paymentByEmail.subscription
      ? [
          prisma.subscription.update({
            where: { id: paymentByEmail.subscription.id },
            data: {
              status: "ACTIVE",
              trialEndsAt: null,
              currentPeriodStart: paymentByEmail.subscription.currentPeriodStart ?? new Date(),
            },
          }),
        ]
      : []),
  ]);
}

export async function GET() {
  return NextResponse.json({
    provider: "INFINITEPAY",
    ok: true,
    message: "Webhook ENEM UP ativo.",
  });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const validSignature = verifyWebhookSignature({
    body: rawBody,
    signature:
      request.headers.get("x-signature") ??
      request.headers.get("x-infinitepay-signature") ??
      request.headers.get("infinitepay-signature"),
    secret: env.INFINITEPAY_WEBHOOK_SECRET,
  });

  if (!validSignature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: WebhookPayload = {};

  if (rawBody) {
    try {
      payload = JSON.parse(rawBody) as WebhookPayload;
    } catch {
      payload = { rawBody };
    }
  }

  await activateRelatedPayment(payload);

  await prisma.adminLog.create({
    data: {
      action: isApprovedPayment(payload)
        ? "INFINITEPAY_PAYMENT_APPROVED"
        : "INFINITEPAY_WEBHOOK_RECEIVED",
      entityType: "InfinitePay",
      metadata: JSON.stringify({
        provider: "INFINITEPAY",
        paymentId: getProviderPaymentId(payload),
        payerEmail: getPayerEmail(payload),
        payload,
      }),
    },
  });

  return NextResponse.json({ received: true });
}
