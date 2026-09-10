"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  getDailyEssayUsage,
  requireActiveSubscription,
} from "@/lib/auth/subscription";
import { aiService } from "@/modules/ai/service";

function clampScore(value: number) {
  return Math.max(40, Math.min(200, value));
}

function estimateCompetencyScores(content: string) {
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const paragraphCount = content.split(/\n\s*\n/).filter((part) => part.trim()).length;
  const hasIntervention =
    /proposta|intervenção|governo|escola|sociedade|familia|midia/i.test(content);
  const hasConnectives =
    /portanto|alem disso|entretanto|desse modo|assim|contudo|logo/i.test(content);

  return [
    clampScore(80 + Math.min(wordCount, 300) * 0.25),
    clampScore(90 + Math.min(wordCount, 280) * 0.25),
    clampScore(80 + paragraphCount * 22),
    clampScore(hasConnectives ? 160 : 100),
    clampScore(hasIntervention ? 180 : 90),
  ].map(Math.round);
}

function buildCompetencyFeedback(score: number, number: number) {
  if (score >= 160) {
    return `Competência ${number}: bom desempenho. Mantenha clareza, repertório e revisão final.`;
  }

  const tips: Record<number, string> = {
    1: "revise concordância, pontuação e escolha vocabular.",
    2: "deixe a tese mais conectada ao tema e evite tangenciar a proposta.",
    3: "fortaleça a seleção de argumentos e use exemplos mais consistentes.",
    4: "use conectivos e retomadas para melhorar a progressão entre ideias.",
    5: "inclua agente, ação, meio, finalidade e detalhamento da intervenção.",
  };

  return `Competência ${number}: ponto de melhoria - ${tips[number]}`;
}

export async function submitEssayAction(formData: FormData) {
  const user = await requireActiveSubscription();
  const usage = await getDailyEssayUsage(user.id);
  const themeId = formData.get("themeId");
  const title = formData.get("title");
  const content = formData.get("content");

  if (!usage.hasRemainingToday) {
    redirect("/essays?limit=daily");
  }

  if (
    typeof themeId !== "string" ||
    typeof content !== "string" ||
    content.trim().length < 120
  ) {
    return;
  }

  const competencies = await prisma.essayCompetency.findMany({
    orderBy: { number: "asc" },
  });
  const scores = estimateCompetencyScores(content);
  const totalScore = scores.reduce((sum, score) => sum + score, 0);
  const aiFeedback = await aiService.chat({
    userId: user.id,
    messages: [
      {
        role: "system",
        content:
          "Você corrige redações estilo ENEM com feedback formativo por competências.",
      },
      {
        role: "user",
        content: `Analise esta redação em até 3 orientações práticas. Nota estimada: ${totalScore}. Texto: ${content.slice(0, 1200)}`,
      },
    ],
  });

  await prisma.essaySubmission.create({
    data: {
      userId: user.id,
      themeId,
      title: typeof title === "string" ? title : null,
      content,
      status: "CORRECTED",
      correctedAt: new Date(),
      correction: {
        create: {
          provider: `AI_${aiFeedback.provider.toUpperCase()}`,
          totalScore,
          generalFeedback: `${aiFeedback.content} Nota estimada por critério demonstrativo ENEM: ${totalScore}/1000.`,
          competencies: {
            create: competencies.map((competency, index) => ({
              competencyId: competency.id,
              score: scores[index] ?? 80,
              feedback: buildCompetencyFeedback(scores[index] ?? 80, competency.number),
            })),
          },
        },
      },
    },
  });

  await prisma.progressRecord.create({
    data: {
      userId: user.id,
      metric: "ESSAY_SUBMITTED",
      value: totalScore,
    },
  });

  revalidatePath("/essays");
  revalidatePath("/dashboard");
}
