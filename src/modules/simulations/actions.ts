"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireActiveSubscription } from "@/lib/auth/subscription";

export async function startSimulationAction(formData: FormData) {
  const user = await requireActiveSubscription();
  const simulationId = formData.get("simulationId");

  if (typeof simulationId !== "string") {
    return;
  }

  const totalQuestions = await prisma.simulationQuestion.count({
    where: { simulationId },
  });

  const run = await prisma.simulationRun.create({
    data: {
      userId: user.id,
      simulationId,
      totalQuestions,
    },
  });

  redirect(`/simulations/${run.id}`);
}

export async function finishSimulationAction(formData: FormData) {
  const user = await requireActiveSubscription();
  const runId = formData.get("runId");

  if (typeof runId !== "string") {
    return;
  }

  const run = await prisma.simulationRun.findFirst({
    where: { id: runId, userId: user.id },
    include: {
      simulation: {
        include: {
          questions: {
            include: {
              question: {
                include: {
                  alternatives: true,
                  subject: true,
                  area: true,
                },
              },
            },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });

  if (!run || run.status === "FINISHED") {
    return;
  }

  let correctCount = 0;
  let wrongCount = 0;
  const answerCreates = [];

  for (const simulationQuestion of run.simulation.questions) {
    const question = simulationQuestion.question;
    const alternativeId = formData.get(`question_${question.id}`);
    const alternative =
      typeof alternativeId === "string"
        ? question.alternatives.find((item) => item.id === alternativeId)
        : undefined;

    if (alternative?.isCorrect) {
      correctCount += 1;
    } else {
      wrongCount += 1;
    }

    if (alternative) {
      answerCreates.push(
        prisma.studentAnswer.create({
          data: {
            userId: user.id,
            questionId: question.id,
            alternativeId: alternative.id,
            simulationRunId: run.id,
            isCorrect: alternative.isCorrect,
          },
        }),
      );
    }
  }

  const totalQuestions = run.simulation.questions.length;
  const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
  const weakSubjects = run.simulation.questions
    .filter((simulationQuestion) => {
      const alternativeId = formData.get(`question_${simulationQuestion.question.id}`);
      const alternative = simulationQuestion.question.alternatives.find(
        (item) => item.id === alternativeId,
      );
      return !alternative?.isCorrect;
    })
    .map((item) => item.question.subject.name);

  await prisma.$transaction([
    ...answerCreates,
    prisma.simulationRun.update({
      where: { id: run.id },
      data: {
        status: "FINISHED",
        score,
        correctCount,
        wrongCount,
        totalQuestions,
        finishedAt: new Date(),
      },
    }),
    prisma.result.upsert({
      where: { simulationRunId: run.id },
      update: {
        totalScore: score,
        weaknesses: weakSubjects.join(", "),
        recommendations:
          weakSubjects.length > 0
            ? `Revise: ${[...new Set(weakSubjects)].join(", ")}.`
            : "Excelente desempenho neste simulado.",
      },
      create: {
        simulationRunId: run.id,
        totalScore: score,
        weaknesses: weakSubjects.join(", "),
        recommendations:
          weakSubjects.length > 0
            ? `Revise: ${[...new Set(weakSubjects)].join(", ")}.`
            : "Excelente desempenho neste simulado.",
      },
    }),
  ]);

  redirect(`/simulations/${run.id}`);
}
