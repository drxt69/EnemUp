import Link from "next/link";
import { CheckCircle2, Filter, Search, XCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireQuestionAccess } from "@/lib/auth/subscription";
import { buildQuestionFeedback } from "@/lib/ai/student-guidance";
import { answerQuestionAction } from "@/modules/questions/actions";

type QuestionsPageProps = {
  searchParams: Promise<{
    area?: string;
    subject?: string;
    difficulty?: string;
    q?: string;
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

export default async function QuestionsPage({ searchParams }: QuestionsPageProps) {
  const { user, hasSubscription, freeUsage } = await requireQuestionAccess();
  const params = await searchParams;

  const [areas, subjects, questions, latestAnswers, publishedQuestionCount] = await Promise.all([
    prisma.area.findMany({ orderBy: { name: "asc" } }),
    prisma.subject.findMany({ orderBy: { name: "asc" }, include: { area: true } }),
    prisma.question.findMany({
      where: {
        isPublished: true,
        area: params.area ? { slug: params.area } : undefined,
        subject: params.subject ? { slug: params.subject } : undefined,
        difficulty: params.difficulty || undefined,
        statement: params.q ? { contains: params.q } : undefined,
      },
      orderBy: { createdAt: "desc" },
      include: {
        area: true,
        subject: true,
        alternatives: { orderBy: { sortOrder: "asc" } },
      },
      take: 20,
    }),
    prisma.studentAnswer.findMany({
      where: { userId: user.id },
      orderBy: { answeredAt: "desc" },
      take: 50,
    }),
    prisma.question.count({ where: { isPublished: true } }),
  ]);

  const answerByQuestion = new Map(
    latestAnswers.map((answer) => [answer.questionId, answer]),
  );
  const feedbackByQuestionId = new Map(
    await Promise.all(
      questions.map(async (question) => {
        const lastAnswer = answerByQuestion.get(question.id);
        const selectedAlternative = lastAnswer
          ? question.alternatives.find((item) => item.id === lastAnswer.alternativeId)
          : null;
        const correctAlternative = question.alternatives.find((item) => item.isCorrect);

        if (!lastAnswer) {
          return [question.id, null] as const;
        }

        return [
          question.id,
          await buildQuestionFeedback({
            subjectName: question.subject.name,
            statement: question.statement,
            selectedLabel: selectedAlternative?.label,
            selectedContent: selectedAlternative?.content,
            correctLabel: correctAlternative?.label,
            correctContent: correctAlternative?.content,
            isCorrect: lastAnswer.isCorrect,
            explanation: question.explanation,
          }),
        ] as const;
      }),
    ),
  );

  return (
    <main className="px-4 py-6 sm:px-6 sm:py-8">
      <section className="mx-auto max-w-7xl min-w-0">
        <div className="rounded-lg border border-white/10 bg-white/8 p-7">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100">
            Banco de questões
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white">
            Resolva, corrija e alimente seu diagnóstico.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Banco com {publishedQuestionCount.toLocaleString("pt-BR")} questões
            publicadas para treino com correção automática e explicação.
          </p>
          {!hasSubscription && freeUsage ? (
            <div className="mt-5 rounded-md border border-amber-300/25 bg-amber-300/10 p-4 text-sm leading-6 text-amber-50">
              Você está no acesso gratuito: ainda pode responder{" "}
              <strong>{freeUsage.remainingQuestions}</strong> de{" "}
              <strong>{freeUsage.limit}</strong> questões de demonstração.
              Depois disso, a assinatura libera o banco completo.
            </div>
          ) : null}
        </div>

        <form className="mt-5 grid gap-3 rounded-lg border border-white/10 bg-slate-900 p-4 lg:grid-cols-[1fr_0.8fr_0.8fr_0.6fr_auto]">
          <label className="grid gap-2 text-sm text-slate-300">
            Busca
            <div className="flex h-11 items-center gap-2 rounded-md border border-white/10 bg-slate-950 px-3">
              <Search aria-hidden className="h-4 w-4 text-slate-500" />
              <input
                name="q"
                defaultValue={params.q}
                placeholder="Termo da questão"
                className="w-full bg-transparent text-sm text-white placeholder:text-slate-500"
              />
            </div>
          </label>
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

        <div className="mt-5 grid gap-4">
          {questions.map((question) => {
            const lastAnswer = answerByQuestion.get(question.id);
            const correctAlternative = question.alternatives.find((item) => item.isCorrect);
            const aiFeedback = feedbackByQuestionId.get(question.id);

            return (
              <article key={question.id} className="min-w-0 overflow-hidden rounded-lg border border-white/10 bg-white/8 p-4 sm:p-6">
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                  <span className="rounded-md bg-cyan-300/15 px-2 py-1 text-cyan-100">{question.area.name}</span>
                  <span className="rounded-md bg-white/10 px-2 py-1 text-slate-200">{question.subject.name}</span>
                  <span className="rounded-md bg-white/10 px-2 py-1 text-slate-200">{question.difficulty}</span>
                  {lastAnswer ? (
                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 ${lastAnswer.isCorrect ? "bg-emerald-300/15 text-emerald-100" : "bg-rose-300/15 text-rose-100"}`}>
                      {lastAnswer.isCorrect ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                      {lastAnswer.isCorrect ? "Correto" : `Errado. Correta: ${correctAlternative?.label ?? ""}`}
                    </span>
                  ) : null}
                </div>
                <h2 className="question-text mt-4 max-w-4xl text-base font-semibold leading-7 text-white sm:text-lg">
                  {question.statement}
                </h2>
                <form action={answerQuestionAction} className="mt-5 grid gap-3">
                  <input type="hidden" name="questionId" value={question.id} />
                  {question.alternatives.map((alternative) => {
                    const isSelected = lastAnswer?.alternativeId === alternative.id;

                    return (
                    <label key={alternative.id} className={`flex min-w-0 cursor-pointer items-start gap-3 rounded-md border p-3 text-sm leading-6 transition sm:p-4 ${alternativeStateClass({ isAnswered: Boolean(lastAnswer), isCorrect: alternative.isCorrect, isSelected })}`}>
                      <input
                        required
                        type="radio"
                        name="alternativeId"
                        value={alternative.id}
                        defaultChecked={isSelected}
                        className="mt-1 shrink-0"
                      />
                      <span className="question-text min-w-0">
                        <strong className={lastAnswer && alternative.isCorrect ? "text-emerald-50" : "text-white"}>{alternative.label}.</strong>{" "}
                        {alternative.content}
                      </span>
                    </label>
                    );
                  })}
                  <button className="inline-flex h-11 w-full items-center justify-center rounded-md bg-cyan-300 px-4 text-sm font-semibold text-slate-950 hover:bg-cyan-200 sm:w-fit">
                    Corrigir questão
                  </button>
                </form>
                {lastAnswer ? (
                  <div className="mt-5 rounded-lg border border-white/10 bg-slate-950/70 p-5">
                    <h3 className="text-lg font-semibold text-white">Explicação da resposta</h3>
                    <p className="question-text mt-3 whitespace-pre-line text-sm leading-7 text-slate-200">{aiFeedback?.text}</p>
                  </div>
                ) : null}
              </article>
            );
          })}
          {questions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-white/15 bg-white/8 p-8 text-center text-sm text-slate-300">
              Nenhuma questão encontrada.{" "}
              <Link href="/questions" className="text-cyan-100 hover:text-cyan-200">
                Limpar filtros
              </Link>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
