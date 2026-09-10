import Link from "next/link";
import { ArrowRight, TimerReset } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireActiveSubscription } from "@/lib/auth/subscription";
import { startSimulationAction } from "@/modules/simulations/actions";

export default async function SimulationsPage() {
  const user = await requireActiveSubscription();
  const [simulations, recentRuns] = await Promise.all([
    prisma.simulation.findMany({
      where: { isPublished: true },
      include: { questions: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.simulationRun.findMany({
      where: { userId: user.id },
      include: { simulation: true },
      orderBy: { startedAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <main className="px-6 py-8">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-lg border border-white/10 bg-white/8 p-7">
          <TimerReset aria-hidden className="h-8 w-8 text-cyan-200" />
          <h1 className="mt-5 text-3xl font-semibold">Simulados</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Inicie uma tentativa, responda as questões e receba um resultado
            com acertos, erros e recomendação de revisão.
          </p>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_0.8fr]">
          <section className="grid gap-4">
            {simulations.map((simulation) => (
              <article key={simulation.id} className="rounded-lg border border-white/10 bg-white/8 p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-white">{simulation.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {simulation.description}
                    </p>
                    <p className="mt-3 text-xs text-slate-400">
                      {simulation.questions.length} questões | {simulation.durationMin ?? 0} min
                    </p>
                  </div>
                  <form action={startSimulationAction}>
                    <input type="hidden" name="simulationId" value={simulation.id} />
                    <button className="inline-flex h-11 items-center gap-2 rounded-md bg-cyan-300 px-4 text-sm font-semibold text-slate-950 hover:bg-cyan-200">
                      Iniciar
                      <ArrowRight aria-hidden className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </section>

          <aside className="rounded-lg border border-white/10 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold text-white">Histórico recente</h2>
            <div className="mt-4 grid gap-3">
              {recentRuns.length > 0 ? (
                recentRuns.map((run) => (
                  <Link
                    href={`/simulations/${run.id}`}
                    key={run.id}
                    className="rounded-md border border-white/10 bg-slate-950/50 p-4 text-sm transition hover:border-cyan-200"
                  >
                    <p className="font-medium text-white">{run.simulation.title}</p>
                    <p className="mt-1 text-slate-400">
                      {run.status} | {run.score === null ? "sem nota" : `${Math.round(run.score)}%`}
                    </p>
                  </Link>
                ))
              ) : (
                <p className="rounded-md border border-dashed border-white/15 p-4 text-sm leading-6 text-slate-300">
                  Nenhuma tentativa ainda.
                </p>
              )}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
