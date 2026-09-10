type StudentProgressInput = {
  answerCount: number;
  correctCount: number;
  essayCount: number;
  finishedSimulationCount: number;
  studyTaskDoneCount?: number;
  dailyCheckInCount?: number;
};

export function calculateStudentProgress(input: StudentProgressInput) {
  const xp =
    input.answerCount * 10 +
    input.correctCount * 15 +
    input.essayCount * 120 +
    input.finishedSimulationCount * 180 +
    (input.studyTaskDoneCount ?? 0) * 25 +
    (input.dailyCheckInCount ?? 0) * 30;
  const level = Math.floor(xp / 300) + 1;
  const currentLevelXp = xp % 300;
  const nextLevelXp = 300;
  const accuracy =
    input.answerCount > 0 ? Math.round((input.correctCount / input.answerCount) * 100) : 0;

  const achievements = [
    {
      key: "first-question",
      title: "Primeira questão",
      unlocked: input.answerCount >= 1,
      description: "Resolva sua primeira questão.",
    },
    {
      key: "ten-questions",
      title: "Aquecimento serio",
      unlocked: input.answerCount >= 10,
      description: "Resolva 10 questões.",
    },
    {
      key: "accuracy-70",
      title: "Precisao em alta",
      unlocked: input.answerCount >= 5 && accuracy >= 70,
      description: "Mantenha 70% ou mais de aproveitamento.",
    },
    {
      key: "first-essay",
      title: "Redator em treino",
      unlocked: input.essayCount >= 1,
      description: "Envie sua primeira redação.",
    },
    {
      key: "first-simulation",
      title: "Modo prova",
      unlocked: input.finishedSimulationCount >= 1,
      description: "Finalize um simulado.",
    },
    {
      key: "daily-checkin",
      title: "Constância diária",
      unlocked: (input.dailyCheckInCount ?? 0) >= 3,
      description: "Faça check-in em 3 dias de estudo.",
    },
  ];

  return {
    xp,
    level,
    currentLevelXp,
    nextLevelXp,
    progressPercent: Math.round((currentLevelXp / nextLevelXp) * 100),
    accuracy,
    achievements,
  };
}
