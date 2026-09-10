"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireQuestionAccess } from "@/lib/auth/subscription";

export async function answerQuestionAction(formData: FormData) {
  const { user } = await requireQuestionAccess();
  const questionId = formData.get("questionId");
  const alternativeId = formData.get("alternativeId");

  if (typeof questionId !== "string" || typeof alternativeId !== "string") {
    return;
  }

  const alternative = await prisma.alternative.findFirst({
    where: {
      id: alternativeId,
      questionId,
    },
  });

  if (!alternative) {
    return;
  }

  await prisma.studentAnswer.create({
    data: {
      userId: user.id,
      questionId,
      alternativeId,
      isCorrect: alternative.isCorrect,
    },
  });

  await prisma.progressRecord.create({
    data: {
      userId: user.id,
      metric: alternative.isCorrect ? "QUESTION_CORRECT" : "QUESTION_WRONG",
      value: 1,
    },
  });

  revalidatePath("/questions");
  revalidatePath("/dashboard");
}
