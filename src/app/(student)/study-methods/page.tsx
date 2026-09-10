import { Brain, Clock, Layers3, ListChecks, Map, MessageSquareText, Repeat2 } from "lucide-react";
import { requireActiveSubscription } from "@/lib/auth/subscription";

const methods = [
  {
    title: "Pomodoro",
    icon: Clock,
    when: "Quando você precisa vencer a procrastinacao.",
    how: "Estude 25 minutos com foco total, pare 5 minutos e repita. Depois de 4 ciclos, faça uma pausa maior.",
  },
  {
    title: "Revisão espaçada",
    icon: Repeat2,
    when: "Quando precisa lembrar conteúdo por semanas.",
    how: "Revise o mesmo assunto em 1, 3, 7, 15 e 30 dias, aumentando o intervalo quando acertar.",
  },
  {
    title: "Prática ativa",
    icon: ListChecks,
    when: "Quando quer transformar teoria em desempenho.",
    how: "Feche o material, resolva questões, explique o raciocínio e corrija os erros com atenção.",
  },
  {
    title: "Método Feynman",
    icon: MessageSquareText,
    when: "Quando um tema parece entendido, mas trava na hora da prova.",
    how: "Explique o assunto em linguagem simples. Onde faltar clareza, volte ao material e reescreva.",
  },
  {
    title: "Mapas mentais",
    icon: Map,
    when: "Quando precisa organizar relações entre ideias.",
    how: "Coloque o tema no centro, crie ramos por conceito e use palavras-chave, exemplos e conexões.",
  },
  {
    title: "Ciclos de estudo",
    icon: Layers3,
    when: "Quando estuda varias matérias por semana.",
    how: "Distribua disciplinas em blocos recorrentes, priorizando dificuldade e peso sem depender de dia fixo.",
  },
] as const;

export default async function StudyMethodsPage() {
  await requireActiveSubscription();

  return (
    <main className="px-6 py-8">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-lg border border-white/10 bg-white/8 p-7">
          <Brain aria-hidden className="h-8 w-8 text-cyan-200" />
          <h1 className="mt-5 text-3xl font-semibold">Métodos de estudo</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Escolha o método pelo problema que você quer resolver hoje:
            concentração, memória, compreensão, organização ou desempenho em
            questões.
          </p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {methods.map((method) => {
            const Icon = method.icon;
            return (
              <article key={method.title} className="rounded-lg border border-white/10 bg-white/8 p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-cyan-300/15 text-cyan-200">
                  <Icon aria-hidden className="h-5 w-5" />
                </div>
                <h2 className="mt-5 text-xl font-semibold text-white">{method.title}</h2>
                <p className="mt-4 text-sm font-medium text-cyan-100">Quando usar</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">{method.when}</p>
                <p className="mt-4 text-sm font-medium text-cyan-100">Como aplicar</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">{method.how}</p>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
