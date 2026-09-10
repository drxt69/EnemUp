import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireActiveSubscription } from "@/lib/auth/subscription";
import { finishSimulationAction } from "@/modules/simulations/actions";

type SimulationRunPageProps = {
  params: Promise<{ runId: string }>;
};

export default async function SimulationRunPage({ params }: SimulationRunPageProps) {
  const user = await requireActiveSubscription();
  const { runId } = await params;
  const run = await prisma.simulationRun.findFirst({
    where: { id: runId, userId: user.id },
    include: {
      result: true,
      answers: true,
      simulation: {
        include: {
          questions: {
            orderBy: { sortOrder: "asc" },
            include: {
              question: {
                include: {
                  area: true,
                  subject: true,
                  alternatives: { orderBy: { sortOrder: "asc" } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!run) {
    return (
      <main className="px-4 py-6 sm:px-6 sm:py-8">
        <section className="mx-auto max-w-5xl rounded-lg border border-white/10 bg-white/8 p-8">
          <h1 className="text-2xl font-semibold">Tentativa não encontrada</h1>
          <Link href="/simulations" className="mt-4 inline-flex text-cyan-100">
            Voltar
          </Link>
        </section>
      </main>
    );
  }

  const answerMap = new Map(run.answers.map((answer) => [answer.questionId, answer]));

  return (
    <main className="px-4 py-6 sm:px-6 sm:py-8">
      <section className="mx-auto max-w-5xl min-w-0">
        <Link href="/simulations" className="inline-flex items-center gap-2 text-sm font-medium text-cyan-100 hover:text-cyan-200">
          <ArrowLeft aria-hidden className="h-4 w-4" />
          Simulados
        </Link>
        <div className="mt-8 rounded-lg border border-white/10 bg-white/8 p-7">
          <h1 className="text-3xl font-semibold">{run.simulation.title}</h1>
          <p className="mt-3 text-sm text-slate-300">
            Status: {run.status} | Questões: {run.totalQuestions}
          </p>
          {run.status === "FINISHED" ? (
            <div className="mt-5 rounded-md border border-cyan-300/20 bg-cyan-300/10 p-5">
              <p className="text-3xl font-semibold text-white">
                {Math.round(run.score ?? 0)}%
              </p>
              <p className="mt-2 text-sm text-cyan-50">
                {run.correctCount} acertos e {run.wrongCount} erros.{" "}
                {run.result?.recommendations}
              </p>
            </div>
          ) : null}
        </div>

        <form action={finishSimulationAction} className="mt-5 grid gap-4">
          <input type="hidden" name="runId" value={run.id} />
          {run.simulation.questions.map((item, index) => {
            const question = item.question;
            const answer = answerMap.get(question.id);

            return (
              <article key={question.id} className="min-w-0 overflow-hidden rounded-lg border border-white/10 bg-white/8 p-4 sm:p-6">
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-300">
                  <span>Questão {index + 1}</span>
                  <span>{question.subject.name}</span>
                  {answer ? (
                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 ${answer.isCorrect ? "bg-emerald-300/15 text-emerald-100" : "bg-rose-300/15 text-rose-100"}`}>
                      {answer.isCorrect ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                      {answer.isCorrect ? "Acerto" : "Erro"}
                    </span>
                  ) : null}
                </div>
                <h2 className="question-text mt-3 text-base font-semibold leading-7 text-white sm:text-lg">
                  {question.statement}
                </h2>
                <div className="mt-5 grid gap-3">
                  {question.alternatives.map((alternative) => (
                    <label key={alternative.id} className="flex min-w-0 items-start gap-3 rounded-md border border-white/10 bg-slate-950/50 p-3 text-sm leading-6 text-slate-200 sm:p-4">
                      <input
                        type="radio"
                        name={`question_${question.id}`}
                        value={alternative.id}
                        required={run.status !== "FINISHED"}
                        disabled={run.status === "FINISHED"}
                        defaultChecked={answer?.alternativeId === alternative.id}
                        className="mt-1 shrink-0"
                      />
                      <span className="question-text min-w-0">
                        <strong className="text-white">{alternative.label}.</strong>{" "}
                        {alternative.content}
                      </span>
                    </label>
                  ))}
                </div>
                {run.status === "FINISHED" ? (
                  <p className="mt-4 rounded-md border border-white/10 bg-slate-950/50 p-4 text-sm leading-6 text-slate-300">
                    <strong className="text-white">Explicação:</strong>{" "}
                    {question.explanation}
                  </p>
                ) : null}
              </article>
            );
          })}
          {run.status !== "FINISHED" ? (
            <button className="inline-flex h-12 items-center justify-center rounded-md bg-cyan-300 px-5 text-sm font-semibold text-slate-950 hover:bg-cyan-200">
              Finalizar simulado
            </button>
          ) : null}
        </form>
      </section>
    </main>
  );
}
