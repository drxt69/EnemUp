import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { type AuthUser, requireUser } from "./session";

export const FREE_QUESTION_LIMIT = 15;
export const MONTHLY_DAILY_ESSAY_LIMIT = 3;
export const ANNUAL_DAILY_ESSAY_LIMIT = 5;

export async function hasActiveSubscription(userId: string) {
  const activeSubscriptions = await prisma.subscription.count({
    where: {
      userId,
      status: "ACTIVE",
      OR: [{ currentPeriodEnd: null }, { currentPeriodEnd: { gt: new Date() } }],
    },
  });

  return activeSubscriptions > 0;
}

export async function getActiveSubscription(userId: string) {
  return prisma.subscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      OR: [{ currentPeriodEnd: null }, { currentPeriodEnd: { gt: new Date() } }],
    },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });
}

function getStartOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export function getDailyEssayLimitByPlan(planInterval?: string) {
  return planInterval === "YEAR"
    ? ANNUAL_DAILY_ESSAY_LIMIT
    : MONTHLY_DAILY_ESSAY_LIMIT;
}

export async function getDailyEssayUsage(userId: string) {
  const activeSubscription = await getActiveSubscription(userId);
  const limit = getDailyEssayLimitByPlan(
    activeSubscription?.plan.billingInterval,
  );
  const usedToday = await prisma.essaySubmission.count({
    where: {
      userId,
      status: "CORRECTED",
      correctedAt: { gte: getStartOfToday() },
    },
  });

  return {
    limit,
    usedToday,
    remainingToday: Math.max(limit - usedToday, 0),
    hasRemainingToday: usedToday < limit,
    planInterval: activeSubscription?.plan.billingInterval ?? null,
  };
}

export async function getFreeQuestionUsage(userId: string) {
  const answeredQuestions = await prisma.studentAnswer.count({
    where: { userId },
  });

  return {
    answeredQuestions,
    remainingQuestions: Math.max(FREE_QUESTION_LIMIT - answeredQuestions, 0),
    limit: FREE_QUESTION_LIMIT,
    hasFreeQuestionsAvailable: answeredQuestions < FREE_QUESTION_LIMIT,
  };
}

export async function getStudentEntryPath(user: Pick<AuthUser, "id" | "role">) {
  if (user.role === "ADMIN") {
    return "/admin";
  }

  if (await hasActiveSubscription(user.id)) {
    return "/dashboard";
  }

  return (await getFreeQuestionUsage(user.id)).hasFreeQuestionsAvailable
    ? "/practice"
    : "/billing?required=subscription";
}

export async function requireActiveSubscription() {
  const user = await requireUser();

  if (user.role === "ADMIN") {
    return user;
  }

  if (!(await hasActiveSubscription(user.id))) {
    redirect("/billing?required=subscription");
  }

  return user;
}

export async function requireQuestionAccess() {
  const user = await requireUser();

  if (user.role === "ADMIN") {
    return { user, hasSubscription: true, freeUsage: null };
  }

  const [hasSubscription, freeUsage] = await Promise.all([
    hasActiveSubscription(user.id),
    getFreeQuestionUsage(user.id),
  ]);

  if (!hasSubscription && !freeUsage.hasFreeQuestionsAvailable) {
    redirect("/billing?required=free-limit");
  }

  return { user, hasSubscription, freeUsage };
}
