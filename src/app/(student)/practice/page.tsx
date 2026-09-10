import Link from "next/link";
import { ArrowRight, CheckCircle2, Filter, Gamepad2, Trophy, XCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireQuestionAccess } from "@/lib/auth/subscription";
import { buildQuestionFeedback } from "@/lib/ai/student-guidance";
import { calculateStudentProgress } from "@/lib/gamification/progress";
import { answerPracticeQuestionAction } from "@/modules/questions/practice-actions";

type PracticePageProps = {
  searchParams: Promise<{
    area?: string;
    subject?: string;
    difficulty?: string;
    questionId?: string;
    index?: string;
    result?: string;
    answerId?: string;
  }>;
};

function alternativeStateClass({
  isAnswered,
  isCorrect,
  isSelected,
}: {
  isAnswered: boolean;
  isCorrect: boolean;
  isSelected: boolean;
}) {
  if (!isAnswered) {
    return "border-white/10 bg-slate-950/50 text-slate-200 hover:border-cyan-200";
  }

  if (isCorrect) {
    return "border-emerald-300/70 bg-emerald-300/10 text-emerald-50";
  }

  if (isSelected) {
    return "border-rose-300/70 bg-rose-300/10 text-rose-50";
  }

  return "border-white/10 bg-slate-950/30 text-slate-400";
}

export default async function PracticePage({ searchParams }: PracticePageProps) {
  const { user, hasSubscription, freeUsage } = await requireQuestionAccess();
  const params = await searchParams;
  const questionWhere = {
    isPublished: true,
    area: params.area ? { slug: params.area } : undefined,
    subject: params.subject ? { slug: params.subject } : undefined,
    difficulty: params.difficulty || undefined,
  };
  const [areas, subjects, filteredQuestionCount, answerCount, correctCount, essayCount, finishedSimulationCount] =
    await Promise.all([
    prisma.area.findMany({ orderBy: { name: "asc" } }),
    prisma.subject.findMany({ orderBy: { name: "asc" }, include: { area: true } }),
    prisma.question.count({ where: questionWhere }),
    prisma.studentAnswer.count({ where: { userId: user.id } }),
    prisma.studentAnswer.count({
      where: { userId: user.id, isCorrect: true },
    }),
    prisma.essaySubmission.count({ where: { userId: user.id } }),
    prisma.simulationRun.count({
      where: { userId: user.id, status: "FINISHED" },
    }),
  ]);
  const progress = calculateStudentProgress({
    answerCount,
    correctCount,
    essayCount,
    finishedSimulationCount,
  });

  const question = await prisma.question.findFirst({
    where: {
      ...questionWhere,
      id: params.questionId || undefined,
    },
    orderBy: { id: "asc" },
    include: {
      subject: true,
      area: true,
      alternatives: { orderBy: { sortOrder: "asc" } },
    },
  }) ?? await prisma.question.findFirst({
    where: questionWhere,
    orderBy: { id: "asc" },
    include: {
      subject: true,
      area: true,
      alternatives: { orderBy: { sortOrder: "asc" } },
    },
  });
  const nextQuestion = question
    ? await prisma.question.findFirst({
        where: {
          ...questionWhere,
          id: { gt: question.id },
        },
        orderBy: { id: "asc" },
        select: { id: true },
      }) ??
      await prisma.question.findFirst({
        where: questionWhere,
        orderBy: { id: "asc" },
        select: { id: true },
      })
    : null;
  const nextQuestionHref = new URLSearchParams();
  if (nextQuestion?.id) nextQuestionHref.set("questionId", nextQuestion.id);
  if (params.area) nextQuestionHref.set("area", params.area);
  if (params.subject) nextQuestionHref.set("subject", params.subject);
  if (params.difficulty) nextQuestionHref.set("difficulty", params.difficulty);
  const feedbackAnswer = params.answerId
    ? await prisma.studentAnswer.findFirst({
        where: { id: params.answerId, userId: user.id },
        include: {
          alternative: true,
          question: {
            include: {
              subject: true,
              alternatives: { orderBy: { sortOrder: "asc" } },
            },
          },
        },
      })
    : null;
  const correctAlternative = feedbackAnswer?.question.alternatives.find((item) => item.isCorrect);
  const aiFeedback = feedbackAnswer
    ? await buildQuestionFeedback({
        subjectName: feedbackAnswer.question.subject.name,
        statement: feedbackAnswer.question.statement,
        selectedLabel: feedbackAnswer.alternative?.label,
        selectedContent: feedbackAnswer.alternative?.content,
        correctLabel: correctAlternative?.label,
        correctContent: correctAlternative?.content,
        isCorrect: feedbackAnswer.isCorrect,
        explanation: feedbackAnswer.question.explanation,
      })
    : null;

  return (
    <main className="px-4 py-6 sm:px-6 sm:py-8">
      <section className="mx-auto max-w-5xl min-w-0">
        <div className="rounded-lg border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_24rem),rgba(255,255,255,0.08)] p-7">
          <Gamepad2 aria-hidden className="h-8 w-8 text-cyan-200" />
          <h1 className="mt-5 text-3xl font-semibold">Missão de questões</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Resolva uma questão por rodada, ganhe XP e avance de nível. Este é
            o modo minigame para transformar treino em progresso visível.
          </p>
          {!hasSubscription && freeUsage ? (
            <div className="mt-5 rounded-md border border-amber-300/25 bg-amber-300/10 p-4 text-sm leading-6 text-amber-50">
              Teste gratuito ativo: você ainda tem{" "}
              <strong>{freeUsage.remainingQuestions}</strong> de{" "}
              <strong>{freeUsage.limit}</strong> questões para conhecer o app.
            </div>
          ) : null}
          <div className="mt-6 rounded-md border border-white/10 bg-slate-950/50 p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="font-semibold text-white">Nível {progress.level}</p>
              <p className="text-sm text-cyan-100">{progress.xp} XP</p>
            </div>
            <div className="mt-3 h-3 rounded-full bg-slate-800">
              <div
                className="h-3 rounded-full bg-cyan-300"
                style={{ width: `${progress.progressPercent}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {progress.currentLevelXp}/{progress.nextLevelXp} XP para o próximo nível
            </p>
          </div>
        </div>

        <form className="mt-5 grid gap-3 rounded-lg border border-white/10 bg-slate-900 p-4 lg:grid-cols-[0.9fr_0.9fr_0.7fr_auto]">
          <label className="grid gap-2 text-sm text-slate-300">
            Área
            <select name="area" defaultValue={params.area ?? ""} className="h-11 rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white">
              <option value="">Todas</option>
              {areas.map((area) => (
                <option key={area.id} value={area.slug}>{area.name}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm text-slate-300">
            Disciplina
            <select name="subject" defaultValue={params.subject ?? ""} className="h-11 rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white">
              <option value="">Todas</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.slug}>{subject.name}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm text-slate-300">
            Dificuldade
            <select name="difficulty" defaultValue={params.difficulty ?? ""} className="h-11 rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white">
              <option value="">Todas</option>
              <option value="EASY">Facil</option>
              <option value="MEDIUM">Media</option>
              <option value="HARD">Dificil</option>
            </select>
          </label>
          <button className="mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-md bg-cyan-300 px-4 text-sm font-semibold text-slate-950 hover:bg-cyan-200">
            <Filter aria-hidden className="h-4 w-4" />
            Filtrar
          </button>
        </form>

        {feedbackAnswer ? (
          <div
            className={`mt-5 flex items-center gap-3 rounded-lg border p-4 ${
              feedbackAnswer.isCorrect
                ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-50"
                : "border-rose-300/20 bg-rose-300/10 text-rose-50"
            }`}
          >
            {feedbackAnswer.isCorrect ? (
              <CheckCircle2 aria-hidden className="h-5 w-5" />
            ) : (
              <XCircle aria-hidden className="h-5 w-5" />
            )}
            <span>
              <strong>{feedbackAnswer.isCorrect ? "Correto." : `Errado. Correta: ${correctAlternative?.label ?? ""}`}</strong>
            </span>
          </div>
        ) : null}

        {question ? (
          <article className="mt-5 min-w-0 overflow-hidden rounded-lg border border-white/10 bg-white/8 p-4 sm:p-6">
            <div className="flex flex-wrap gap-2 text-xs font-medium">
              <span className="rounded-md bg-cyan-300/15 px-2 py-1 text-cyan-100">
                {filteredQuestionCount.toLocaleString("pt-BR")} questões no filtro
              </span>
              <span className="rounded-md bg-white/10 px-2 py-1 text-slate-200">
                {question.subject.name}
              </span>
              <span className="rounded-md bg-white/10 px-2 py-1 text-slate-200">
                {question.difficulty}
              </span>
            </div>
            <h2 className="question-text mt-5 text-base font-semibold leading-7 text-white sm:text-xl sm:leading-8">
              {question.statement}
            </h2>
            <form action={answerPracticeQuestionAction} className="mt-6 grid gap-3">
              <input type="hidden" name="questionId" value={question.id} />
              <input type="hidden" name="nextQuestionId" value={nextQuestion?.id ?? ""} />
              <input type="hidden" name="area" value={params.area ?? ""} />
              <input type="hidden" name="subject" value={params.subject ?? ""} />
              <input type="hidden" name="difficulty" value={params.difficulty ?? ""} />
              {question.alternatives.map((alternative) => {
                const isAnsweredQuestion = feedbackAnswer?.questionId === question.id;
                const isSelected = feedbackAnswer?.alternativeId === alternative.id;

                return (
                <label key={alternative.id} className={`flex min-w-0 cursor-pointer items-start gap-3 rounded-md border p-3 text-sm leading-6 transition sm:p-4 ${alternativeStateClass({ isAnswered: isAnsweredQuestion, isCorrect: alternative.isCorrect, isSelected })}`}>
                  <input required type="radio" name="alternativeId" value={alternative.id} defaultChecked={isSelected} className="mt-1 shrink-0" />
                  <span className="question-text min-w-0">
                    <strong className={isAnsweredQuestion && alternative.isCorrect ? "text-emerald-50" : "text-white"}>{alternative.label}.</strong>{" "}
                    {alternative.content}
                  </span>
                </label>
                );
              })}
              <button className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-cyan-300 px-5 text-sm font-semibold text-slate-950 hover:bg-cyan-200">
                Responder
                <ArrowRight aria-hidden className="h-4 w-4" />
              </button>
            </form>
            {feedbackAnswer ? (
              <div className="mt-5 rounded-lg border border-white/10 bg-slate-950/70 p-5">
                <h3 className="text-lg font-semibold text-white">Explicação da resposta</h3>
                <p className="question-text mt-3 whitespace-pre-line text-sm leading-7 text-slate-200">{aiFeedback?.text}</p>
                <Link
                  href={`/practice?${nextQuestionHref.toString()}`}
                  className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-cyan-300 px-4 text-sm font-semibold text-slate-950 hover:bg-cyan-200"
                >
                  Proxima questão
                  <ArrowRight aria-hidden className="h-4 w-4" />
                </Link>
              </div>
            ) : null}
          </article>
        ) : (
          <p className="mt-5 rounded-lg border border-dashed border-white/15 p-6 text-sm text-slate-300">
            Ainda não existem questões publicadas.
          </p>
        )}

        <section className="mt-5 rounded-lg border border-white/10 bg-slate-900 p-6">
          <div className="flex items-center gap-3">
            <Trophy aria-hidden className="h-6 w-6 text-amber-200" />
            <h2 className="text-xl font-semibold text-white">Conquistas</h2>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {progress.achievements.map((achievement) => (
              <div
                key={achievement.key}
                className={`rounded-md border p-4 ${
                  achievement.unlocked
                    ? "border-amber-300/20 bg-amber-300/10"
                    : "border-white/10 bg-slate-950/50"
                }`}
              >
                <p className="font-medium text-white">{achievement.title}</p>
                <p className="mt-1 text-sm text-slate-300">{achievement.description}</p>
              </div>
            ))}
          </div>
          <Link href="/dashboard" className="mt-5 inline-flex text-sm font-medium text-cyan-100 hover:text-cyan-200">
            Ver dashboard de evolução
          </Link>
        </section>
      </section>
    </main>
  );
}
