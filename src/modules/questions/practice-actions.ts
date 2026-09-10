"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireQuestionAccess } from "@/lib/auth/subscription";

export async function answerPracticeQuestionAction(formData: FormData) {
  const { user } = await requireQuestionAccess();
  const questionId = formData.get("questionId");
  const alternativeId = formData.get("alternativeId");
  const nextQuestionId = formData.get("nextQuestionId");
  const area = formData.get("area");
  const subject = formData.get("subject");
  const difficulty = formData.get("difficulty");

  if (
    typeof questionId !== "string" ||
    typeof alternativeId !== "string"
  ) {
    return;
  }

  const alternative = await prisma.alternative.findFirst({
    where: { id: alternativeId, questionId },
  });

  if (!alternative) {
    return;
  }

  const answer = await prisma.studentAnswer.create({
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
      metric: alternative.isCorrect ? "PRACTICE_CORRECT" : "PRACTICE_WRONG",
      value: alternative.isCorrect ? 25 : 10,
    },
  });

  const params = new URLSearchParams({
    questionId,
    result: alternative.isCorrect ? "correct" : "wrong",
    answerId: answer.id,
  });
  if (typeof nextQuestionId === "string" && nextQuestionId) {
    params.set("nextQuestionId", nextQuestionId);
  }
  if (typeof area === "string" && area) params.set("area", area);
  if (typeof subject === "string" && subject) params.set("subject", subject);
  if (typeof difficulty === "string" && difficulty) params.set("difficulty", difficulty);

  redirect(`/practice?${params.toString()}`);
}
