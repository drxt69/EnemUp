"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireActiveSubscription } from "@/lib/auth/subscription";

function getStartOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export async function dailyCheckInAction() {
  const user = await requireActiveSubscription();
  const today = getStartOfToday();
  const alreadyCheckedIn = await prisma.progressRecord.findFirst({
    where: {
      userId: user.id,
      metric: "DAILY_CHECKIN",
      recordedAt: { gte: today },
    },
  });

  if (!alreadyCheckedIn) {
    await prisma.progressRecord.create({
      data: {
        userId: user.id,
        metric: "DAILY_CHECKIN",
        value: 30,
      },
    });
  }

  revalidatePath("/dashboard");
}
