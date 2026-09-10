"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

export async function updateUserAccessAction(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const userId = getFormValue(formData, "userId");
  const nextStatus = getFormValue(formData, "status");

  if (!userId || !["ACTIVE", "BLOCKED"].includes(nextStatus)) {
    return;
  }

  if (userId === admin.id && nextStatus === "BLOCKED") {
    return;
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, status: true },
  });

  if (!targetUser || targetUser.status === nextStatus) {
    return;
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: targetUser.id },
      data: { status: nextStatus },
    }),
    ...(nextStatus === "BLOCKED"
      ? [
          prisma.session.deleteMany({
            where: { userId: targetUser.id },
          }),
        ]
      : []),
    prisma.adminLog.create({
      data: {
        actorUserId: admin.id,
        action: nextStatus === "ACTIVE" ? "USER_ACCESS_RELEASED" : "USER_ACCESS_BLOCKED",
        entityType: "User",
        entityId: targetUser.id,
        metadata: JSON.stringify({
          email: targetUser.email,
          previousStatus: targetUser.status,
          nextStatus,
        }),
      },
    }),
  ]);

  revalidatePath("/admin");
}

export async function grantUserSubscriptionAction(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const userId = getFormValue(formData, "userId");
  const planId = getFormValue(formData, "planId");

  if (!userId || !planId) {
    return;
  }

  const [targetUser, plan] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    }),
    prisma.plan.findUnique({
      where: { id: planId },
    }),
  ]);

  if (!targetUser || !plan?.isActive) {
    return;
  }

  const subscription = await prisma.subscription.create({
    data: {
      userId: targetUser.id,
      planId: plan.id,
      provider: "ADMIN_RELEASE",
      providerSubscriptionId: `admin_${crypto.randomUUID()}`,
      status: "ACTIVE",
      trialEndsAt: null,
      currentPeriodStart: new Date(),
      currentPeriodEnd: addDays(plan.billingInterval === "YEAR" ? 365 : 30),
    },
  });

  await prisma.$transaction([
    prisma.subscription.updateMany({
      where: {
        userId: targetUser.id,
        status: "ACTIVE",
        id: { not: subscription.id },
      },
      data: {
        status: "CANCELLED",
        canceledAt: new Date(),
      },
    }),
    prisma.payment.create({
      data: {
        userId: targetUser.id,
        subscriptionId: subscription.id,
        provider: "ADMIN_RELEASE",
        providerPaymentId: `admin_payment_${crypto.randomUUID()}`,
        status: "PAID",
        amountCents: plan.priceCents,
        currency: plan.currency,
        paidAt: new Date(),
        metadata: JSON.stringify({
          releasedBy: admin.email,
          reason: "Liberação administrativa de acesso premium.",
        }),
      },
    }),
    prisma.adminLog.create({
      data: {
        actorUserId: admin.id,
        action: "SUBSCRIPTION_ACCESS_GRANTED",
        entityType: "User",
        entityId: targetUser.id,
        metadata: JSON.stringify({
          email: targetUser.email,
          plan: plan.key,
          subscriptionId: subscription.id,
        }),
      },
    }),
  ]);

  revalidatePath("/admin");
}

export async function revokeUserSubscriptionAction(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const userId = getFormValue(formData, "userId");

  if (!userId) {
    return;
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });

  if (!targetUser) {
    return;
  }

  await prisma.$transaction([
    prisma.subscription.updateMany({
      where: { userId: targetUser.id, status: "ACTIVE" },
      data: {
        status: "CANCELLED",
        canceledAt: new Date(),
      },
    }),
    prisma.session.deleteMany({
      where: { userId: targetUser.id },
    }),
    prisma.adminLog.create({
      data: {
        actorUserId: admin.id,
        action: "SUBSCRIPTION_ACCESS_REVOKED",
        entityType: "User",
        entityId: targetUser.id,
        metadata: JSON.stringify({
          email: targetUser.email,
        }),
      },
    }),
  ]);

  revalidatePath("/admin");
}
