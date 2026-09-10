import { CalendarCheck, Target } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireActiveSubscription } from "@/lib/auth/subscription";
import { generateStudyPlanAction } from "@/modules/study-plan/actions";

export default async function StudyPlanPage() {
  const user = await requireActiveSubscription();
  const [subjects, activePlan] = await Promise.all([
    prisma.subject.findMany({ orderBy: { name: "asc" }, include: { area: true } }),
    prisma.studyPlan.findFirst({
      where: { userId: user.id, status: "ACTIVE" },
      include: {
        schedules: {
          orderBy: { date: "asc" },
          include: {
            tasks: { orderBy: { sortOrder: "asc" } },
          },
        },
      },
    }),
  ]);

  return (
    <main className="px-6 py-8">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-lg border border-white/10 bg-white/8 p-7">
          <CalendarCheck aria-hidden className="h-8 w-8 text-cyan-200" />
          <h1 className="mt-5 text-3xl font-semibold">Plano de estudos personalizado</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Gere um cronograma inicial com matérias, tempo, exercícios
            e revisões. Depois a IA pode refinar esse plano com seu desempenho.
          </p>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <form action={generateStudyPlanAction} className="rounded-lg border border-white/10 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold text-white">Configurar plano</h2>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm text-slate-300">
                Objetivo
                <input name="objective" required placeholder="Ex: melhorar matemática e redação" className="h-11 rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white" />
              </label>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="grid gap-2 text-sm text-slate-300">
                  Horas/semana
                  <input name="availability" type="number" min="2" max="60" defaultValue="10" className="h-11 rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white" />
                </label>
                <label className="grid gap-2 text-sm text-slate-300">
                  Dias
                  <input name="days" type="number" min="3" max="60" defaultValue="14" className="h-11 rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white" />
                </label>
                <label className="grid gap-2 text-sm text-slate-300">
                  Data da prova
                  <input name="examDate" type="date" className="h-11 rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white" />
                </label>
              </div>
              <label className="grid gap-2 text-sm text-slate-300">
                Nível atual
                <select name="currentLevel" defaultValue="INTERMEDIATE" className="h-11 rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white">
                  <option value="BEGINNER">Iniciante</option>
                  <option value="INTERMEDIATE">Intermediário</option>
                  <option value="ADVANCED">Avancado</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm text-slate-300">
                Dificuldades
                <textarea name="difficultyNotes" rows={3} className="rounded-md border border-white/10 bg-slate-950 p-3 text-sm text-white" />
              </label>
              <fieldset className="grid gap-3">
                <legend className="text-sm font-medium text-slate-300">Matérias</legend>
                <div className="grid max-h-64 gap-2 overflow-y-auto rounded-md border border-white/10 bg-slate-950 p-3 sm:grid-cols-2">
                  {subjects.map((subject) => (
                    <label key={subject.id} className="flex items-center gap-2 text-sm text-slate-200">
                      <input type="checkbox" name="subjectIds" value={subject.id} />
                      {subject.name}
                    </label>
                  ))}
                </div>
              </fieldset>
              <button className="inline-flex h-12 items-center justify-center rounded-md bg-cyan-300 px-5 text-sm font-semibold text-slate-950 hover:bg-cyan-200">
                Gerar plano
              </button>
            </div>
          </form>

          <section className="rounded-lg border border-white/10 bg-white/8 p-6">
            <div className="flex items-center gap-3">
              <Target aria-hidden className="h-6 w-6 text-emerald-200" />
              <h2 className="text-xl font-semibold text-white">Cronograma ativo</h2>
            </div>
            {activePlan ? (
              <div className="mt-5">
                <h3 className="font-semibold text-white">{activePlan.title}</h3>
                <p className="mt-1 text-sm text-slate-400">{activePlan.availability}</p>
                <div className="mt-5 grid gap-4">
                  {activePlan.schedules.slice(0, 14).map((schedule) => (
                    <article key={schedule.id} className="rounded-md border border-white/10 bg-slate-950/50 p-4">
                      <p className="text-sm font-semibold text-white">
                        {schedule.date.toLocaleDateString("pt-BR")} | {schedule.title}
                      </p>
                      <div className="mt-3 grid gap-2">
                        {schedule.tasks.map((task) => (
                          <div key={task.id} className="rounded-md bg-slate-900 px-3 py-2 text-sm text-slate-300">
                            {task.title} {task.durationMin ? `- ${task.durationMin} min` : ""}
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-5 rounded-md border border-dashed border-white/15 p-5 text-sm leading-6 text-slate-300">
                Nenhum plano ativo ainda. Preencha o formulário para criar o
                primeiro cronograma.
              </p>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
