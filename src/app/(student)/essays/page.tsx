import { FileText, PenTool } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  getDailyEssayUsage,
  requireActiveSubscription,
} from "@/lib/auth/subscription";
import { submitEssayAction } from "@/modules/essays/actions";

type EssaysPageProps = {
  searchParams: Promise<{
    limit?: string;
  }>;
};

export default async function EssaysPage({ searchParams }: EssaysPageProps) {
  const user = await requireActiveSubscription();
  const params = await searchParams;
  const [themes, submissions, essayUsage] = await Promise.all([
    prisma.essayTheme.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.essaySubmission.findMany({
      where: { userId: user.id },
      orderBy: { submittedAt: "desc" },
      include: {
        theme: true,
        correction: {
          include: {
            competencies: {
              include: { competency: true },
              orderBy: { competency: { number: "asc" } },
            },
          },
        },
      },
    }),
    getDailyEssayUsage(user.id),
  ]);

  return (
    <main className="px-6 py-8">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-lg border border-white/10 bg-white/8 p-7">
          <PenTool aria-hidden className="h-8 w-8 text-cyan-200" />
          <h1 className="mt-5 text-3xl font-semibold">Redação ENEM</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Escolha um tema, escreva sua redação e receba uma correção
            demonstrativa pelas cinco competências.
          </p>
          <div className="mt-5 rounded-md border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm leading-6 text-cyan-50">
            Seu plano permite <strong>{essayUsage.limit}</strong> correções de
            redação por dia. Hoje você ainda tem{" "}
            <strong>{essayUsage.remainingToday}</strong> correção(ões)
            disponível(is).
          </div>
          {params.limit === "daily" ? (
            <div className="mt-4 rounded-md border border-amber-300/25 bg-amber-300/10 p-4 text-sm leading-6 text-amber-50">
              Você atingiu o limite diário de correções do seu plano. Novas
              correções ficam disponíveis amanhã.
            </div>
          ) : null}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <form action={submitEssayAction} className="rounded-lg border border-white/10 bg-white/8 p-6">
            <h2 className="text-xl font-semibold text-white">Nova redação</h2>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm text-slate-300">
                Tema
                <select name="themeId" required className="h-11 rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white">
                  {themes.map((theme) => (
                    <option key={theme.id} value={theme.id}>{theme.title}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm text-slate-300">
                Título opcional
                <input name="title" className="h-11 rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white" />
              </label>
              <label className="grid gap-2 text-sm text-slate-300">
                Texto
                <textarea
                  name="content"
                  required
                  minLength={120}
                  rows={14}
                  className="rounded-md border border-white/10 bg-slate-950 p-4 text-sm leading-6 text-white placeholder:text-slate-500"
                  placeholder="Escreva sua redação com introdução, desenvolvimento e proposta de intervenção."
                />
              </label>
              <button className="inline-flex h-12 items-center justify-center rounded-md bg-cyan-300 px-5 text-sm font-semibold text-slate-950 hover:bg-cyan-200">
                Enviar para correção
              </button>
            </div>
          </form>

          <aside className="rounded-lg border border-white/10 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold text-white">Temas disponíveis</h2>
            <div className="mt-4 grid gap-3">
              {themes.map((theme) => (
                <article key={theme.id} className="rounded-md border border-white/10 bg-slate-950/50 p-4">
                  <h3 className="font-medium text-white">{theme.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{theme.prompt}</p>
                </article>
              ))}
            </div>
          </aside>
        </div>

        <section className="mt-5 rounded-lg border border-white/10 bg-white/8 p-6">
          <div className="flex items-center gap-3">
            <FileText aria-hidden className="h-6 w-6 text-cyan-200" />
            <h2 className="text-xl font-semibold text-white">Histórico</h2>
          </div>
          <div className="mt-5 grid gap-4">
            {submissions.length > 0 ? (
              submissions.map((submission) => (
                <article key={submission.id} className="rounded-lg border border-white/10 bg-slate-950/50 p-5">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row">
                    <div>
                      <h3 className="font-semibold text-white">{submission.theme.title}</h3>
                      <p className="mt-1 text-sm text-slate-400">{submission.title ?? "Sem título"}</p>
                    </div>
                    <p className="text-3xl font-semibold text-cyan-100">
                      {submission.correction?.totalScore ?? 0}
                    </p>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-300">
                    {submission.correction?.generalFeedback}
                  </p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-5">
                    {submission.correction?.competencies.map((score) => (
                      <div key={score.id} className="rounded-md border border-white/10 bg-slate-900 p-3">
                        <p className="text-xs text-slate-400">C{score.competency.number}</p>
                        <p className="mt-1 text-lg font-semibold text-white">{score.score}</p>
                      </div>
                    ))}
                  </div>
                </article>
              ))
            ) : (
              <p className="rounded-md border border-dashed border-white/15 p-5 text-sm text-slate-300">
                Nenhuma redação enviada ainda.
              </p>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
