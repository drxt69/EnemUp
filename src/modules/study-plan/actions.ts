"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireActiveSubscription } from "@/lib/auth/subscription";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getStringArray(formData: FormData, key: string) {
  return formData.getAll(key).filter((value): value is string => typeof value === "string");
}

export async function generateStudyPlanAction(formData: FormData) {
  const user = await requireActiveSubscription();
  const objective = getString(formData, "objective");
  const availability = Number(getString(formData, "availability") || "7");
  const days = Math.max(3, Math.min(60, Number(getString(formData, "days") || "14")));
  const currentLevel = getString(formData, "currentLevel") || "INTERMEDIATE";
  const difficultyNotes = getString(formData, "difficultyNotes");
  const examDateRaw = getString(formData, "examDate");
  const subjectIds = getStringArray(formData, "subjectIds");

  if (!objective || subjectIds.length === 0) {
    return;
  }

  const subjects = await prisma.subject.findMany({
    where: { id: { in: subjectIds } },
    include: {
      topics: {
        orderBy: { name: "asc" },
        take: 1,
      },
    },
  });

  const minutesPerDay = Math.max(30, Math.round((availability * 60) / 6));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.studyPlan.updateMany({
    where: { userId: user.id, status: "ACTIVE" },
    data: { status: "ARCHIVED" },
  });

  await prisma.studyPlan.create({
    data: {
      userId: user.id,
      title: `Plano ${days} dias - ${objective}`,
      objective,
      availability: `${availability} horas por semana`,
      currentLevel,
      difficultyNotes,
      examDate: examDateRaw ? new Date(`${examDateRaw}T12:00:00`) : null,
      schedules: {
        create: Array.from({ length: days }).map((_, index) => {
          const subject = subjects[index % subjects.length];
          const topic = subject?.topics[0];
          const date = new Date(today);
          date.setDate(today.getDate() + index);

          return {
            date,
            title: `Dia ${index + 1}: ${subject?.name ?? "Revisão geral"}`,
            notes:
              index % 7 === 6
                ? "Dia recomendado para simulado curto e revisão dos erros."
                : "Bloco de estudo guiado com prática ativa.",
            tasks: {
              create: [
                {
                  topicId: topic?.id,
                  type: "STUDY",
                  title: `Estudar fundamentos de ${subject?.name ?? "ENEM"}`,
                  durationMin: Math.round(minutesPerDay * 0.5),
                  sortOrder: 1,
                },
                {
                  topicId: topic?.id,
                  type: "PRACTICE",
                  title: "Resolver questões e corrigir erros",
                  durationMin: Math.round(minutesPerDay * 0.35),
                  exerciseCount: 8,
                  sortOrder: 2,
                },
                {
                  topicId: topic?.id,
                  type: "REVIEW",
                  title: "Resumo ativo e revisão espaçada",
                  durationMin: Math.round(minutesPerDay * 0.15),
                  sortOrder: 3,
                },
              ],
            },
          };
        }),
      },
    },
  });

  revalidatePath("/study-plan");
  revalidatePath("/dashboard");
}
