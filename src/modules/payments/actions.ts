"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { getInfinitePayCheckoutUrl } from "@/lib/payments/infinitepay";

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

export async function startInfinitePayCheckoutAction(formData: FormData) {
  const user = await requireUser();
  const planId = formData.get("planId");

  if (typeof planId !== "string") {
    return;
  }

  const plan = await prisma.plan.findUnique({ where: { id: planId } });

  if (!plan || !plan.isActive) {
    return;
  }

  const checkoutUrl = getInfinitePayCheckoutUrl(plan.key);

  if (!checkoutUrl) {
    return;
  }

  const subscription = await prisma.subscription.create({
    data: {
      userId: user.id,
      planId: plan.id,
      provider: "INFINITEPAY",
      providerSubscriptionId: `pending_${crypto.randomUUID()}`,
      status: "PENDING",
      trialEndsAt: null,
      currentPeriodEnd: addDays(plan.billingInterval === "YEAR" ? 365 : 30),
    },
  });

  await prisma.payment.create({
    data: {
      userId: user.id,
      subscriptionId: subscription.id,
      provider: "INFINITEPAY",
      providerPaymentId: `pending_${crypto.randomUUID()}`,
      status: "PENDING",
      amountCents: plan.priceCents,
      currency: plan.currency,
      metadata: JSON.stringify({
        checkoutUrl,
        planKey: plan.key,
        userEmail: user.email,
        startedAt: new Date().toISOString(),
      }),
    },
  });

  revalidatePath("/billing");
  redirect(checkoutUrl);
}

export async function cancelSubscriptionAction(formData: FormData) {
  const user = await requireUser();
  const subscriptionId = formData.get("subscriptionId");

  if (typeof subscriptionId !== "string") {
    return;
  }

  await prisma.subscription.updateMany({
    where: { id: subscriptionId, userId: user.id },
    data: {
      status: "CANCELLED",
      cancelAtPeriodEnd: true,
      canceledAt: new Date(),
    },
  });

  revalidatePath("/billing");
}
