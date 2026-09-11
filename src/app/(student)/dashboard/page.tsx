import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  BrainCircuit,
  CheckCircle2,
  FileText,
  Gamepad2,
  PenTool,
  Target,
  TimerReset,
  Trophy,
  TrendingUp,
  Zap,
} from "lucide-react";
import { requireActiveSubscription } from "@/lib/auth/subscription";
import { prisma } from "@/lib/prisma";
import { calculateStudentProgress } from "@/lib/gamification/progress";
import { dailyCheckInAction } from "@/modules/gamification/actions";

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function getAccuracy(correct: number, total: number) {
  return total > 0 ? (correct / total) * 100 : 0;
}

function getPriorityLabel(answered: number, accuracyValue: number) {
  if (answered === 0) return "Começar";
  if (accuracyValue < 50) return "Prioridade alta";
  if (accuracyValue < 70) return "Reforcar";
  return "Manter ritmo";
}

function getPriorityClass(answered: number, accuracyValue: number) {
  if (answered === 0) return "border-sky-300/20 bg-sky-300/10 text-sky-100";
  if (accuracyValue < 50) return "border-rose-300/20 bg-rose-300/10 text-rose-100";
  if (accuracyValue < 70) return "border-amber-300/20 bg-amber-300/10 text-amber-100";
  return "border-emerald-300/20 bg-emerald-300/10 text-emerald-100";
}

function getStartOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function getCheckInStreak(records: { recordedAt: Date }[]) {
  const dates = new Set(
    records.map((record) => record.recordedAt.toISOString().slice(0, 10)),
  );
  let streak = 0;
  const cursor = getStartOfToday();

  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export default async function DashboardPage() {
  const user = await requireActiveSubscription();
  const [
    answerCount,
    correctCount,
    essayCount,
    simulationRunCount,
    finishedSimulationCount,
    activeStudyPlan,
    recentAnswers,
    progressRecords,
    subjects,
    allAnswers,
    publishedQuestionsBySubject,
    checkInCount,
    recentCheckInRecords,
    todayCheckIn,
  ] = await Promise.all([
    prisma.studentAnswer.count({ where: { userId: user.id } }),
    prisma.studentAnswer.count({ where: { userId: user.id, isCorrect: true } }),
    prisma.essaySubmission.count({ where: { userId: user.id } }),
    prisma.simulationRun.count({ where: { userId: user.id } }),
    prisma.simulationRun.count({ where: { userId: user.id, status: "FINISHED" } }),
    prisma.studyPlan.findFirst({
      where: { userId: user.id, status: "ACTIVE" },
      include: {
        schedules: {
          orderBy: { date: "asc" },
          take: 1,
          include: {
            tasks: {
              orderBy: { sortOrder: "asc" },
              take: 4,
            },
          },
        },
      },
    }),
    prisma.studentAnswer.findMany({
      where: { userId: user.id },
      orderBy: { answeredAt: "desc" },
      take: 5,
      include: {
        alternative: true,
        question: {
          include: {
            subject: true,
            area: true,
            alternatives: true,
          },
        },
      },
    }),
    prisma.progressRecord.findMany({
      where: { userId: user.id },
      orderBy: { recordedAt: "desc" },
      take: 6,
    }),
    prisma.subject.findMany({
      orderBy: { name: "asc" },
      include: { area: true },
    }),
    prisma.studentAnswer.findMany({
      where: { userId: user.id },
      include: {
        question: {
          select: {
            subjectId: true,
          },
        },
      },
    }),
    prisma.question.groupBy({
      by: ["subjectId"],
      where: { isPublished: true },
      _count: { _all: true },
    }),
    prisma.progressRecord.count({
      where: { userId: user.id, metric: "DAILY_CHECKIN" },
    }),
    prisma.progressRecord.findMany({
      where: { userId: user.id, metric: "DAILY_CHECKIN" },
      orderBy: { recordedAt: "desc" },
      take: 60,
    }),
    prisma.progressRecord.findFirst({
      where: {
        userId: user.id,
        metric: "DAILY_CHECKIN",
        recordedAt: { gte: getStartOfToday() },
      },
    }),
  ]);

  const accuracy = getAccuracy(correctCount, answerCount);
  const studentProgress = calculateStudentProgress({
    answerCount,
    correctCount,
    essayCount,
    finishedSimulationCount,
    dailyCheckInCount: checkInCount,
  });
  const checkInStreak = getCheckInStreak(recentCheckInRecords);
  const weakSignals = recentAnswers
    .filter((answer) => !answer.isCorrect)
    .map((answer) => answer.question.subject.name);
  const recommendation =
    weakSignals[0] ??
    (answerCount === 0
      ? "Comece resolvendo questões por disciplina para gerar diagnóstico."
      : "Mantenha revisões curtas e um simulado por semana.");

  const cards = [
    {
      label: "Questões resolvidas",
      value: answerCount.toString(),
      icon: BookOpenCheck,
      detail: `${correctCount} acertos registrados`,
    },
    {
      label: "Aproveitamento",
      value: formatPercent(accuracy),
      icon: TrendingUp,
      detail: answerCount > 0 ? "Calculado pelas respostas" : "Aguardando respostas",
    },
    {
      label: "Redacoes",
      value: essayCount.toString(),
      icon: PenTool,
      detail: "Envios no histórico",
    },
    {
      label: "Simulados",
      value: simulationRunCount.toString(),
      icon: TimerReset,
      detail: "Tentativas iniciadas",
    },
  ];
  const publishedBySubject = new Map(
    publishedQuestionsBySubject.map((item) => [item.subjectId, item._count._all]),
  );
  const subjectPerformance = subjects
    .map((subject) => {
      const subjectAnswers = allAnswers.filter(
        (answer) => answer.question.subjectId === subject.id,
      );
      const answered = subjectAnswers.length;
      const correct = subjectAnswers.filter((answer) => answer.isCorrect).length;
      const wrong = answered - correct;
      const subjectAccuracy = getAccuracy(correct, answered);

      return {
        id: subject.id,
        name: subject.name,
        slug: subject.slug,
        area: subject.area.name,
        areaSlug: subject.area.slug,
        answered,
        correct,
        wrong,
        available: publishedBySubject.get(subject.id) ?? 0,
        accuracy: subjectAccuracy,
        priority: getPriorityLabel(answered, subjectAccuracy),
        priorityClass: getPriorityClass(answered, subjectAccuracy),
      };
    })
    .filter((item) => item.available > 0 || item.answered > 0)
    .sort((a, b) => {
      if (a.answered === 0 && b.answered > 0) return -1;
      if (b.answered === 0 && a.answered > 0) return 1;
      if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy;
      return b.available - a.available;
    });
  const prioritySubjects = subjectPerformance.slice(0, 3);

  return (
    <main className="px-6 py-8">
      <section className="mx-auto max-w-7xl">
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-lg border border-white/10 bg-white/8 p-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-300/15 text-cyan-200">
              <BarChart3 aria-hidden className="h-6 w-6" />
            </div>
            <h1 className="mt-6 text-3xl font-semibold">Dashboard do aluno</h1>
            <p className="mt-3 max-w-2xl text-slate-300">
              Bem-vindo, {user.name ?? user.email}. Seu painel concentra
              progresso, desempenho, rotina do dia e recomendações iniciais.
            </p>
          </div>
          <aside className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-7">
            <BrainCircuit aria-hidden className="h-7 w-7 text-cyan-100" />
            <h2 className="mt-5 text-xl font-semibold text-white">
              Recomendação da IA
            </h2>
            <p className="mt-3 text-sm leading-6 text-cyan-50">
              {recommendation}
            </p>
          </aside>
        </div>

        <section className="mt-5 rounded-lg border border-amber-300/20 bg-[linear-gradient(135deg,rgba(251,191,36,0.12),rgba(34,211,238,0.08))] p-6">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <div className="flex items-center gap-3">
                <Trophy aria-hidden className="h-7 w-7 text-amber-200" />
                <h2 className="text-2xl font-semibold text-white">
                  Evolucao do aluno: Nível {studentProgress.level}
                </h2>
              </div>
              <p className="mt-2 text-sm text-slate-300">
                {studentProgress.xp} XP acumulados | {studentProgress.accuracy}% de aproveitamento
              </p>
              <div className="mt-4 h-3 max-w-xl rounded-full bg-slate-800">
                <div
                  className="h-3 rounded-full bg-amber-300"
                  style={{ width: `${studentProgress.progressPercent}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-400">
                {studentProgress.currentLevelXp}/{studentProgress.nextLevelXp} XP para o próximo nível
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-80">
              <form action={dailyCheckInAction}>
                <button
                  disabled={Boolean(todayCheckIn)}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-cyan-300 px-5 text-sm font-semibold text-slate-950 hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
                >
                  <Zap aria-hidden className="h-4 w-4" />
                  {todayCheckIn ? "Check-in feito" : "Check-in diário +30 XP"}
                </button>
              </form>
              <Link
                href="/practice"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-amber-300 px-5 text-sm font-semibold text-slate-950 hover:bg-amber-200"
              >
                <Gamepad2 aria-hidden className="h-4 w-4" />
                Jogar missão
              </Link>
              <div className="rounded-md border border-white/10 bg-slate-950/45 p-3 sm:col-span-2">
                <p className="text-sm font-semibold text-white">
                  Sequência atual: {checkInStreak} dia(s)
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Faça check-in todos os dias para manter a constância e acumular XP.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {studentProgress.achievements.map((achievement) => (
              <div
                key={achievement.key}
                className={`rounded-md border p-3 ${
                  achievement.unlocked
                    ? "border-amber-300/20 bg-amber-300/10"
                    : "border-white/10 bg-slate-950/40"
                }`}
              >
                <p className="text-sm font-medium text-white">{achievement.title}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {achievement.unlocked ? "Desbloqueada" : achievement.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <article key={card.label} className="rounded-lg border border-white/10 bg-white/8 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-950/70 text-cyan-200">
                    <Icon aria-hidden className="h-5 w-5" />
                  </div>
                  <p className="text-3xl font-semibold text-white">{card.value}</p>
                </div>
                <h2 className="mt-4 text-sm font-semibold text-slate-100">
                  {card.label}
                </h2>
                <p className="mt-1 text-xs text-slate-400">{card.detail}</p>
              </article>
            );
          })}
        </div>

        <section className="mt-5 rounded-lg border border-white/10 bg-white/8 p-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100">
                Desempenho por disciplina
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Onde você está forte e onde precisa atacar.
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                O painel cruza suas respostas com cada matéria. Disciplinas sem
                respostas aparecem como ponto de partida para gerar diagnóstico.
              </p>
            </div>
            <Link
              href="/questions"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-cyan-300 px-4 text-sm font-semibold text-slate-950 hover:bg-cyan-200"
            >
              Resolver por disciplina
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {prioritySubjects.map((subject) => (
              <article
                key={subject.id}
                className={`rounded-lg border p-4 ${subject.priorityClass}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-80">
                      {subject.priority}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-white">
                      {subject.name}
                    </h3>
                    <p className="mt-1 text-xs opacity-80">{subject.area}</p>
                  </div>
                  {subject.answered > 0 && subject.accuracy >= 70 ? (
                    <CheckCircle2 aria-hidden className="h-5 w-5 shrink-0" />
                  ) : (
                    <AlertTriangle aria-hidden className="h-5 w-5 shrink-0" />
                  )}
                </div>
                <p className="mt-4 text-sm">
                  {subject.answered === 0
                    ? `${subject.available} questões disponíveis para iniciar.`
                    : `${formatPercent(subject.accuracy)} de aproveitamento em ${subject.answered} respostas.`}
                </p>
                <Link
                  href={`/practice?subject=${subject.slug}`}
                  className="mt-4 inline-flex text-sm font-semibold text-white hover:text-cyan-50"
                >
                  Treinar agora
                  <ArrowRight aria-hidden className="ml-2 h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-5 overflow-hidden rounded-lg border border-white/10">
            <div className="grid grid-cols-[1fr_auto_auto] gap-3 bg-slate-950/70 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 sm:grid-cols-[1fr_0.8fr_0.7fr_0.7fr_1fr_auto]">
              <span>Disciplina</span>
              <span className="hidden sm:block">Área</span>
              <span>Resp.</span>
              <span>Acertos</span>
              <span className="hidden sm:block">Aproveitamento</span>
              <span className="text-right">Treino</span>
            </div>
            <div className="divide-y divide-white/10">
              {subjectPerformance.map((subject) => (
                <div
                  key={subject.id}
                  className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-4 text-sm sm:grid-cols-[1fr_0.8fr_0.7fr_0.7fr_1fr_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-white">{subject.name}</p>
                    <p className="mt-1 text-xs text-slate-400 sm:hidden">
                      {subject.area}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {subject.available} questões no banco
                    </p>
                  </div>
                  <span className="hidden text-slate-300 sm:block">{subject.area}</span>
                  <span className="text-slate-200">{subject.answered}</span>
                  <span className="text-slate-200">
                    {subject.correct}/{subject.wrong}
                  </span>
                  <div className="hidden sm:block">
                    <div className="flex items-center gap-3">
                      <div className="h-2 flex-1 rounded-full bg-slate-800">
                        <div
                          className="h-2 rounded-full bg-cyan-300"
                          style={{ width: `${Math.min(subject.accuracy, 100)}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-xs text-slate-300">
                        {formatPercent(subject.accuracy)}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/questions?subject=${subject.slug}`}
                    className="text-right text-sm font-medium text-cyan-100 hover:text-cyan-200"
                  >
                    Abrir
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-lg border border-white/10 bg-white/8 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Plano de hoje</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Próximo bloco do cronograma ativo.
                </p>
              </div>
              <Target aria-hidden className="h-6 w-6 text-emerald-200" />
            </div>
            {activeStudyPlan?.schedules[0] ? (
              <div className="mt-5">
                <p className="font-medium text-white">
                  {activeStudyPlan.schedules[0].title}
                </p>
                <div className="mt-4 grid gap-3">
                  {activeStudyPlan.schedules[0].tasks.map((task) => (
                    <div key={task.id} className="rounded-md border border-white/10 bg-slate-950/50 p-3">
                      <p className="text-sm font-medium text-slate-100">{task.title}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {task.type} {task.durationMin ? `| ${task.durationMin} min` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-md border border-dashed border-white/15 bg-slate-950/40 p-5">
                <p className="text-sm leading-6 text-slate-300">
                  Você ainda não tem um plano ativo. Gere um cronograma
                  personalizado e mantenha seu perfil pronto para recomendações melhores.
                </p>
                <Link
                  href="/study-plan"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-cyan-100 hover:text-cyan-200"
                >
                  Abrir plano de estudos
                  <ArrowRight aria-hidden className="h-4 w-4" />
                </Link>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-white/10 bg-white/8 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Atividade recente</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Últimas respostas e registros de progresso.
                </p>
              </div>
              <FileText aria-hidden className="h-6 w-6 text-cyan-200" />
            </div>
            <div className="mt-5 grid gap-3">
              {recentAnswers.length > 0 ? (
                recentAnswers.map((answer) => (
                  <div key={answer.id} className="rounded-md border border-white/10 bg-slate-950/50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-white">
                        {answer.question.subject.name}
                      </p>
                      <span
                        className={`rounded-md px-2 py-1 text-xs font-medium ${
                          answer.isCorrect
                            ? "bg-emerald-300/15 text-emerald-100"
                            : "bg-rose-300/15 text-rose-100"
                        }`}
                      >
                        {answer.isCorrect ? "Acerto" : "Erro"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {answer.question.area.name}
                    </p>
                    <p className="mt-3 text-xs leading-5 text-slate-300">
                      Você marcou{" "}
                      <strong className="text-white">
                        {answer.alternative?.label ?? "sem alternativa"}
                      </strong>
                      . Correta:{" "}
                      <strong className="text-white">
                        {answer.question.alternatives.find((item) => item.isCorrect)?.label ?? "em revisão"}
                      </strong>
                      .
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-md border border-dashed border-white/15 bg-slate-950/40 p-5 text-sm leading-6 text-slate-300">
                  Sem atividade ainda. Assim que você resolver questões ou
                  fizer simulados, este painel vira seu histórico de estudo.
                </p>
              )}
              {progressRecords.length > 0 ? (
                <div className="rounded-md border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-300">
                  {progressRecords.length} registros de progresso recentes.
                </div>
              ) : null}
            </div>
          </section>
        </div>

        <section className="mt-5 rounded-lg border border-white/10 bg-white/8 p-6">
          <h2 className="text-xl font-semibold text-white">Próximos atalhos</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["/questions", "Resolver questões"],
              ["/practice", "Missão gamificada"],
              ["/simulations", "Fazer simulado"],
              ["/essays", "Treinar redação"],
              ["/ai-tutor", "Perguntar para IA"],
              ["/study-methods", "Ver métodos"],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="inline-flex h-12 items-center justify-between rounded-md border border-white/10 bg-slate-950/50 px-4 text-sm font-medium text-slate-100 transition hover:border-cyan-200 hover:text-cyan-100"
              >
                {label}
                <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
