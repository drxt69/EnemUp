import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { verifyWebhookSignature } from "@/lib/security/webhook";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const validSignature = verifyWebhookSignature({
    body: rawBody,
    signature: request.headers.get("x-signature"),
    secret: env.MERCADOPAGO_WEBHOOK_SECRET,
  });

  if (!validSignature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = rawBody ? JSON.parse(rawBody) : null;

  await prisma.adminLog.create({
    data: {
      action: "PAYMENT_WEBHOOK_RECEIVED",
      entityType: "MercadoPago",
      metadata: JSON.stringify({
        provider: "MERCADOPAGO",
        payload,
      }),
    },
  });

  return NextResponse.json({ received: true });
}
