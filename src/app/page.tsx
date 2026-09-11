import type { ComponentType } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  BrainCircuit,
  CalendarCheck,
  Check,
  ChevronDown,
  ClipboardList,
  Flame,
  Gamepad2,
  Menu,
  PenTool,
  ShieldCheck,
  Sparkles,
  Target,
  TimerReset,
  Trophy,
  TrendingUp,
  Zap,
} from "lucide-react";
import { LandingEvents } from "@/components/analytics/landing-events";
import { AppLogo } from "@/components/brand/app-logo";

type LandingPlan = {
  id: string;
  key: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  billingInterval: "MONTH" | "YEAR";
  trialDays: number;
  isActive: boolean;
};

type IconType = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

const navItems = [
  ["#recursos", "Recursos"],
  ["#questoes", "Questões"],
  ["#redacao", "Redação"],
  ["#simulados", "Simulados"],
  ["#planos", "Planos"],
] as const;

const productAreas: Array<{
  title: string;
  description: string;
  href: string;
  icon: IconType;
}> = [
  {
    title: "Dashboard",
    description: "Acompanhe respostas, aproveitamento, matérias fortes e pontos de atenção.",
    href: "/dashboard",
    icon: BarChart3,
  },
  {
    title: "Banco de questões",
    description: "Treine por área, disciplina, dificuldade e busca por termo.",
    href: "/questions",
    icon: ClipboardList,
  },
  {
    title: "Simulados",
    description: "Inicie tentativas, veja acertos e revise o que precisa melhorar.",
    href: "/simulations",
    icon: TimerReset,
  },
  {
    title: "Redação",
    description: "Envie textos e receba uma avaliação educacional por competência.",
    href: "/essays",
    icon: PenTool,
  },
  {
    title: "Tutor com IA",
    description: "Tire dúvidas, revise conteúdos e entenda melhor seus erros.",
    href: "/ai-tutor",
    icon: BrainCircuit,
  },
  {
    title: "Plano de estudos",
    description: "Monte uma rotina com matérias, exercícios e revisões.",
    href: "/study-plan",
    icon: CalendarCheck,
  },
  {
    title: "Missão gamificada",
    description: "Resolva uma questão por rodada, ganhe XP e acompanhe sua evolução.",
    href: "/practice",
    icon: Gamepad2,
  },
];

const questionFeatures = [
  "Filtros por matéria",
  "Filtros por assunto",
  "Dificuldade",
  "Questões publicadas do ENEM",
  "Correção automática",
  "Explicações da resposta",
  "Histórico de acertos e erros",
];

const faqItems = [
  [
    "Posso usar o ENEM UP gratuitamente?",
    "Sim. O cadastro libera 15 questões de demonstração para conhecer o app. O acesso completo é liberado depois da confirmação do pagamento da assinatura.",
  ],
  [
    "As questões são voltadas para o ENEM?",
    "Sim. O banco é organizado pelas áreas e disciplinas do ENEM, com filtros para facilitar o treino.",
  ],
  [
    "Como funciona a correção de redação com IA?",
    "Você envia sua redação e recebe uma avaliação educacional baseada nas cinco competências do ENEM. A nota é uma estimativa para estudo e não substitui a correção oficial.",
  ],
  [
    "Quantas redações posso corrigir?",
    "No plano mensal, você pode corrigir até 3 redações por dia. No plano anual, o limite é de 5 redações por dia.",
  ],
  [
    "Posso usar pelo celular?",
    "Sim. A plataforma é um aplicativo web responsivo para estudar pelo computador ou pelo celular.",
  ],
  [
    "Como funcionam os simulados?",
    "Você inicia uma tentativa, responde as questões e acompanha resultado, acertos, erros e revisão.",
  ],
  [
    "Como funciona o plano de estudos?",
    "O aluno informa objetivo, disponibilidade, nível e dificuldades. A plataforma organiza um cronograma inicial com matérias, exercícios e revisões.",
  ],
  [
    "Posso cancelar quando quiser?",
    "A área de assinatura possui controle de cancelamento. A efetivação segue as regras do plano e do meio de pagamento utilizado.",
  ],
] as const;

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function getQuestionCountLabel(count: number) {
  if (count >= 1500) {
    return "+1.500";
  }

  return formatNumber(count);
}

function getPlanInterval(interval: string) {
  return interval === "YEAR" ? "por ano" : "por mês";
}

function getMonthlyEquivalent(cents: number) {
  return formatCurrency(Math.round(cents / 12));
}

const plans: LandingPlan[] = [
  {
    id: "monthly",
    key: "monthly",
    name: "Plano Mensal",
    description: "Acesso premium mensal sem período de teste.",
    priceCents: 1999,
    currency: "BRL",
    billingInterval: "MONTH",
    trialDays: 0,
    isActive: true,
  },
  {
    id: "annual",
    key: "annual",
    name: "Plano Anual",
    description: "Acesso premium anual com melhor custo-benefício.",
    priceCents: 9999,
    currency: "BRL",
    billingInterval: "YEAR",
    trialDays: 0,
    isActive: true,
  },
];

export default function Home() {
  const publishedQuestionCount = 1500;
  const simulationCount = 1;
  const essayThemeCount = 2;

  const monthlyPlan = plans.find((plan) => plan.billingInterval === "MONTH");
  const annualPlan = plans.find((plan) => plan.billingInterval === "YEAR");
  const annualSavings =
    monthlyPlan && annualPlan
      ? monthlyPlan.priceCents * 12 - annualPlan.priceCents
      : null;
  const annualSavingsPercent =
    monthlyPlan && annualPlan
      ? Math.round((annualSavings! / (monthlyPlan.priceCents * 12)) * 100)
      : null;
  const visibleQuestionCount = getQuestionCountLabel(publishedQuestionCount);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "EducationalApplication",
    name: "ENEM UP",
    url: "https://enemup.com",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    inLanguage: "pt-BR",
    description:
      "Plataforma de estudos para o ENEM com questões, simulados, redação com IA, plano de estudos e dashboard de desempenho.",
    educationalLevel: "Ensino médio",
    teaches: [
      "ENEM",
      "questões ENEM",
      "simulado ENEM",
      "redação ENEM",
      "plano de estudos ENEM",
    ],
    offers: plans.map((plan) => ({
      "@type": "Offer",
      name: plan.name,
      price: (plan.priceCents / 100).toFixed(2),
      priceCurrency: plan.currency,
      availability: "https://schema.org/InStock",
    })),
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <LandingEvents />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#020617_0%,#082f49_52%,#020617_100%)]">
        <div className="absolute inset-x-0 top-0 h-px bg-cyan-200/30" />
        <div className="landing-aurora absolute inset-0" />
        <div className="landing-grid absolute inset-0" />
        <div className="landing-particle landing-particle-one" />
        <div className="landing-particle landing-particle-two" />
        <div className="landing-particle landing-particle-three" />
        <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 sm:py-5">
          <header className="sticky top-3 z-30 rounded-lg border border-white/10 bg-slate-950/82 px-3 py-3 shadow-2xl shadow-slate-950/35 backdrop-blur sm:px-4">
            <div className="flex items-center justify-between gap-3">
              <Link href="/" aria-label="ENEM UP">
                <AppLogo />
              </Link>
              <nav className="hidden items-center gap-6 text-sm font-medium text-slate-300 lg:flex">
                {navItems.map(([href, label]) => (
                  <a key={href} href={href} className="transition hover:text-white">
                    {label}
                  </a>
                ))}
              </nav>
              <details className="relative lg:hidden">
                <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-md border border-white/15 text-slate-100 transition hover:border-cyan-200">
                  <Menu aria-hidden className="h-5 w-5" />
                  <span className="sr-only">Abrir menu</span>
                </summary>
                <div className="absolute right-0 mt-3 grid w-56 gap-1 rounded-lg border border-white/10 bg-slate-950 p-2 shadow-2xl">
                  {navItems.map(([href, label]) => (
                    <a key={href} href={href} className="rounded-md px-3 py-2 text-sm text-slate-200 hover:bg-white/8">
                      {label}
                    </a>
                  ))}
                  <Link href="/login" className="rounded-md px-3 py-2 text-sm text-slate-200 hover:bg-white/8">
                    Entrar
                  </Link>
                </div>
              </details>
              <div className="hidden items-center gap-3 sm:flex">
                <Link
                  href="/login"
                  className="inline-flex h-10 items-center rounded-md border border-white/15 px-4 text-sm font-semibold text-slate-100 transition hover:border-cyan-200 hover:text-cyan-100"
                >
                  Entrar
                </Link>
                <Link
                  href="/register"
                  data-analytics-event="cta_start_free"
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-cyan-300 px-4 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
                >
                  Começar grátis
                  <ArrowRight aria-hidden className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </header>

          <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[0.92fr_1.08fr] lg:py-16">
            <div>
              <p className="inline-flex rounded-md border border-cyan-200/25 bg-cyan-200/10 px-3 py-1 text-sm font-semibold text-cyan-50">
                Plataforma de estudos para o ENEM
              </p>
              <h1 className="mt-5 max-w-4xl text-3xl font-black leading-tight text-white sm:text-6xl lg:text-7xl">
                Estude para o ENEM com um plano feito para você.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">
                {visibleQuestionCount} questões, simulados, redação corrigida por
                IA, plano de estudos e acompanhamento do seu desempenho em um só
                lugar.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {[
                  `${visibleQuestionCount} questões`,
                  "Redação com IA",
                  "Simulados",
                  "Plano personalizado",
                  "Gamificação",
                ].map((benefit) => (
                  <span key={benefit} className="rounded-md border border-white/10 bg-white/8 px-3 py-2 text-sm font-semibold text-slate-100">
                    {benefit}
                  </span>
                ))}
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  data-analytics-event="cta_start_free"
                  className="landing-cta inline-flex h-12 items-center justify-center gap-2 rounded-md bg-cyan-300 px-5 text-sm font-black text-slate-950 transition hover:bg-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-100"
                >
                  Começar grátis
                  <ArrowRight aria-hidden className="h-4 w-4" />
                </Link>
                <a
                  href="#como-funciona"
                  className="inline-flex h-12 items-center justify-center rounded-md border border-white/15 px-5 text-sm font-bold text-white transition hover:border-cyan-200 hover:text-cyan-100"
                >
                  Ver como funciona
                </a>
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-400">
                Cadastro gratuito com 15 questões de demonstração. O acesso
                completo aos recursos pagos é liberado após confirmação da assinatura.
              </p>
            </div>

            <div className="landing-hero-stage relative">
              <div className="absolute -inset-4 rounded-xl bg-cyan-300/10 blur-2xl" />
              <div className="landing-orbit pointer-events-none relative mx-auto mb-5 flex h-48 w-48 items-center justify-center sm:h-60 sm:w-60">
                <div className="landing-orbit-ring" />
                <div className="landing-orbit-ring landing-orbit-ring-alt" />
                <div className="landing-orbit-card landing-orbit-card-one">
                  <Trophy aria-hidden className="h-5 w-5" />
                  <span>92%</span>
                </div>
                <div className="landing-orbit-card landing-orbit-card-two">
                  <Zap aria-hidden className="h-5 w-5" />
                  <span>+30 XP</span>
                </div>
                <div className="landing-orbit-card landing-orbit-card-three">
                  <TrendingUp aria-hidden className="h-5 w-5" />
                  <span>Meta</span>
                </div>
                <div className="landing-orbit-core">
                  <BookOpenCheck aria-hidden className="h-14 w-14 text-slate-950" />
                </div>
              </div>
              <div className="landing-product-frame relative overflow-hidden rounded-lg border border-white/10 bg-slate-950 shadow-2xl">
                <div className="landing-frame-toolbar flex items-center justify-between border-b border-white/10 bg-slate-950/95 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                  </div>
                  <span className="text-xs font-semibold text-cyan-100">Painel ENEM UP</span>
                </div>
                <Image
                  src="/landing-hero.png"
                  alt="Tela do ENEM UP com dashboard e fluxo de estudos"
                  width={1685}
                  height={899}
                  priority
                  className="h-auto w-full"
                />
                <div className="landing-floating-panel landing-floating-panel-left">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100">
                    Hoje
                  </span>
                  <strong>Check-in +30 XP</strong>
                </div>
                <div className="landing-floating-panel landing-floating-panel-right">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100">
                    Aprovação
                  </span>
                  <strong>92% real</strong>
                </div>
                <div className="grid gap-3 border-t border-white/10 bg-slate-950/92 p-4 sm:grid-cols-3">
                  {[
                    ["Diagnóstico", "por disciplina"],
                    ["Missões", "com XP"],
                    ["Aprovação", "92% de taxa"],
                  ].map(([title, detail]) => (
                    <div key={title} className="rounded-md bg-white/8 p-3">
                      <p className="text-sm font-semibold text-white">{title}</p>
                      <p className="mt-1 text-xs text-slate-400">{detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="border-y border-white/10 bg-slate-900 px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-100">
              Veja como funciona
            </p>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-5xl">
              Tudo conectado para você estudar com menos dúvida e mais direção.
            </h2>
          </div>
          <div id="recursos" className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {productAreas.map((area, index) => {
              const Icon = area.icon;

              return (
                <Link
                  key={area.title}
                  href={area.href}
                  data-analytics-event={index === 1 ? "question_started" : undefined}
                  className="landing-depth-card rounded-lg border border-white/10 bg-slate-950/55 p-5 transition hover:-translate-y-0.5 hover:border-cyan-200/45 md:min-h-52"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-md bg-cyan-300/15 text-cyan-100">
                    <Icon aria-hidden className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-white">{area.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{area.description}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section id="questoes" className="bg-slate-950 px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-100">
              Banco de questões
            </p>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-5xl">
              {visibleQuestionCount} questões para você praticar.
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-300">
              Treine com filtros, corrija suas respostas e use cada erro como
              sinal do que revisar primeiro.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {questionFeatures.map((feature) => (
                <div key={feature} className="flex items-start gap-3 text-sm text-slate-200">
                  <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            <Link
              href="/questions"
              data-analytics-event="question_started"
              className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-cyan-300 px-5 text-sm font-black text-slate-950 transition hover:bg-cyan-200"
            >
              Começar a resolver questões
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </div>
          <div className="landing-depth-card rounded-lg border border-white/10 bg-white/8 p-4 sm:p-6">
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-md bg-cyan-300/15 px-2 py-1 text-cyan-100">Matemática</span>
              <span className="rounded-md bg-white/10 px-2 py-1 text-slate-200">Média</span>
              <span className="rounded-md bg-emerald-300/15 px-2 py-1 text-emerald-100">Explicação</span>
            </div>
            <h3 className="mt-5 text-lg font-bold leading-7 text-white">
              Uma estudante resolveu 40 questões em uma semana e acertou 70%.
              Quantas questões ela acertou?
            </h3>
            <div className="mt-5 grid gap-3">
              {["24", "26", "28", "30", "32"].map((option, index) => (
                <div
                  key={option}
                  className={`landing-answer-option rounded-md border p-3 text-sm ${
                    option === "28"
                      ? "border-emerald-300/60 bg-emerald-300/10 text-emerald-50"
                      : "border-white/10 bg-slate-950/50 text-slate-300"
                  }`}
                >
                  <strong>{String.fromCharCode(65 + index)}.</strong> {option}
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-md border border-white/10 bg-slate-950/70 p-4">
              <p className="text-sm font-bold text-white">Gabarito explicado</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                70% de 40 equivale a 0,70 x 40. O resultado é 28, então a alternativa correta é C.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="redacao" className="border-y border-white/10 bg-slate-900 px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div className="landing-depth-card rounded-lg border border-cyan-200/20 bg-[linear-gradient(135deg,rgba(34,211,238,0.12),rgba(16,185,129,0.08))] p-5 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-cyan-100">Avaliação educacional</p>
                <h3 className="mt-2 text-2xl font-black text-white">Nota estimada: 820</h3>
              </div>
              <PenTool aria-hidden className="h-8 w-8 text-cyan-100" />
            </div>
            <div className="mt-6 grid gap-3">
              {[180, 160, 160, 160, 160].map((score, index) => (
                <div key={score + index} className="rounded-md border border-white/10 bg-slate-950/60 p-3">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-bold text-white">Competência {index + 1}</span>
                    <span className="text-cyan-100">{score}/200</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-800">
                    <div className="landing-progress-fill h-2 rounded-full bg-cyan-300" style={{ width: `${(score / 200) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {["Pontos fortes", "O que melhorar", "Sugestões"].map((item) => (
                <div key={item} className="rounded-md bg-slate-950/55 p-3 text-sm font-semibold text-slate-100">
                  {item}
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-400">Exemplo visual da avaliação.</p>
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-100">
              Redação com IA
            </p>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-5xl">
              Escreva. Envie. Descubra como melhorar.
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-300">
              A IA analisa sua redação pelas cinco competências do ENEM, mostra
              pontos fortes, pontos que precisam melhorar e sugestões para a
              próxima versão.
            </p>
            <p className="mt-4 rounded-md border border-amber-200/20 bg-amber-200/10 p-4 text-sm leading-6 text-amber-50">
              A avaliação é uma estimativa educacional para orientar seus estudos
              e não substitui a correção oficial do ENEM.
            </p>
            <Link
              href="/essays"
              data-analytics-event="essay_started"
              className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-cyan-300 px-5 text-sm font-black text-slate-950 transition hover:bg-cyan-200"
            >
              Corrigir minha redação
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-3">
          <article className="landing-depth-card rounded-lg border border-amber-200/20 bg-[linear-gradient(135deg,rgba(251,191,36,0.12),rgba(34,211,238,0.07))] p-7">
            <Trophy aria-hidden className="h-9 w-9 text-amber-200" />
            <h2 className="mt-5 text-3xl font-black text-white">
              Quanto mais você estuda, mais você evolui.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              A missão gamificada transforma questões respondidas, acertos,
              redações e simulados em XP, níveis e conquistas.
            </p>
            <div className="mt-6 h-3 rounded-full bg-slate-800">
              <div className="landing-xp-fill h-3 w-7/12 rounded-full bg-amber-300" />
            </div>
            <p className="mt-2 text-xs text-slate-400">Exemplo visual de progresso</p>
          </article>
          <article id="simulados" className="landing-depth-card rounded-lg border border-white/10 bg-white/8 p-7">
            <TimerReset aria-hidden className="h-8 w-8 text-cyan-200" />
            <h2 className="mt-5 text-2xl font-black text-white">Simulados para medir seu preparo.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              {simulationCount > 0
                ? `${simulationCount} simulado(s) publicado(s) no sistema para iniciar uma tentativa e revisar o resultado.`
                : "A área de simulados está pronta para receber provas publicadas."}
            </p>
            <Link href="/simulations" data-analytics-event="simulation_started" className="mt-6 inline-flex text-sm font-bold text-cyan-100 hover:text-cyan-200">
              Fazer um simulado <ArrowRight aria-hidden className="ml-2 h-4 w-4" />
            </Link>
          </article>
          <article className="landing-depth-card rounded-lg border border-white/10 bg-white/8 p-7">
            <BrainCircuit aria-hidden className="h-8 w-8 text-emerald-200" />
            <h2 className="mt-5 text-2xl font-black text-white">Uma IA para estudar junto.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Entenda questões, revise conteúdos, peça ajuda para organizar
              métodos de estudo e aprenda com seus erros sem linguagem técnica.
            </p>
            <Link href="/ai-tutor" className="mt-6 inline-flex text-sm font-bold text-cyan-100 hover:text-cyan-200">
              Abrir tutor <ArrowRight aria-hidden className="ml-2 h-4 w-4" />
            </Link>
          </article>
        </div>
      </section>

      <section className="border-y border-white/10 bg-slate-900 px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-100">
              Dashboard e plano de estudos
            </p>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-5xl">
              Descubra onde você precisa melhorar.
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-300">
              Você não precisa decidir sozinho o que estudar todos os dias. O
              painel reúne aproveitamento, questões respondidas, matérias com
              dificuldade e próximos passos do cronograma.
            </p>
            <Link
              href="/study-plan"
              className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-cyan-300 px-5 text-sm font-black text-slate-950 transition hover:bg-cyan-200"
            >
              Criar plano de estudos
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Aproveitamento", "72%", BarChart3],
              ["Questões respondidas", "Histórico real do aluno", BookOpenCheck],
              ["Pontos fracos", "Matérias com mais erros", Target],
              ["Sequência", "Ritmo de estudo", Flame],
            ].map(([title, value, Icon]) => (
              <article key={title as string} className="landing-depth-card landing-dashboard-tile rounded-lg border border-white/10 bg-slate-950/60 p-5">
                <Icon aria-hidden className="h-6 w-6 text-cyan-200" />
                <h3 className="mt-4 text-lg font-bold text-white">{title as string}</h3>
                <p className="mt-2 text-sm text-slate-300">{value as string}</p>
                <p className="mt-4 text-xs text-slate-500">Exemplo visual</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 lg:grid-cols-4">
            {[
              ["92%", "taxa real de aprovação"],
              [formatNumber(publishedQuestionCount), "questões publicadas"],
              [formatNumber(simulationCount), "simulados publicados"],
              [formatNumber(essayThemeCount), "temas de redação"],
            ].map(([value, label]) => (
              <div key={label} className="landing-metric-card border-t border-white/10 pt-5">
                <p className="text-3xl font-black text-white">{value}</p>
                <p className="mt-2 text-sm text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="planos" className="border-y border-white/10 bg-slate-900 px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-100">
              Planos
            </p>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-5xl">
              Escolha seu plano e continue evoluindo.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Os preços abaixo vêm dos planos ativos configurados no sistema.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {plans.map((plan) => {
              const isAnnual = plan.billingInterval === "YEAR";

              return (
                <article
                  key={plan.id}
                  className={`relative rounded-lg border p-7 ${
                    isAnnual
                      ? "border-cyan-200/45 bg-cyan-300/10"
                      : "border-white/10 bg-slate-950/60"
                  }`}
                >
                  {isAnnual ? (
                    <span className="mb-4 inline-flex rounded-md bg-cyan-300 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-slate-950">
                      Melhor custo-benefício
                    </span>
                  ) : null}
                  <h3 className="text-2xl font-black text-white">{plan.name}</h3>
                  <p className="mt-3 min-h-12 text-sm leading-6 text-slate-300">{plan.description}</p>
                  <p className="mt-6 text-4xl font-black text-white">
                    {formatCurrency(plan.priceCents)}
                  </p>
                  <p className="mt-2 text-sm text-slate-400">{getPlanInterval(plan.billingInterval)}</p>
                  {isAnnual && monthlyPlan && annualPlan ? (
                    <div className="mt-5 rounded-md border border-cyan-200/20 bg-slate-950/55 p-4 text-sm leading-6 text-cyan-50">
                      Equivale a cerca de {getMonthlyEquivalent(plan.priceCents)}/mês.
                      12 meses do mensal saem por {formatCurrency(monthlyPlan.priceCents * 12)}.
                      Economia anual: {formatCurrency(annualSavings ?? 0)}
                      {annualSavingsPercent ? `, aproximadamente ${annualSavingsPercent}%.` : "."}
                    </div>
                  ) : null}
                  <ul className="mt-6 grid gap-3 text-sm text-slate-200">
                    {[
                      "Questões e simulados",
                      isAnnual ? "5 redações com IA por dia" : "3 redações com IA por dia",
                      "Dashboard de desempenho",
                      "Plano de estudos",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-3">
                        <Check aria-hidden className="h-4 w-4 text-emerald-300" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/register"
                    data-analytics-event="subscription_viewed"
                    className="mt-7 inline-flex h-12 w-full items-center justify-center rounded-md bg-cyan-300 px-4 text-sm font-black text-slate-950 transition hover:bg-cyan-200"
                  >
                    Assinar agora
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="faq" className="bg-slate-950 px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-100">
            FAQ
          </p>
          <h2 className="mt-3 text-3xl font-black text-white">Perguntas frequentes</h2>
          <div className="mt-8 grid gap-3">
            {faqItems.map(([question, answer]) => (
              <details key={question} className="group rounded-lg border border-white/10 bg-white/8 p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-white">
                  {question}
                  <ChevronDown aria-hidden className="h-5 w-5 shrink-0 text-cyan-100 transition group-open:rotate-180" />
                </summary>
                <p className="mt-4 text-sm leading-7 text-slate-300">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-900 px-4 py-16 sm:px-6">
        <div className="landing-depth-card mx-auto max-w-7xl rounded-lg border border-cyan-200/20 bg-[linear-gradient(135deg,rgba(34,211,238,0.16),rgba(16,185,129,0.08))] p-7 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <Sparkles aria-hidden className="h-8 w-8 text-cyan-100" />
              <h2 className="mt-5 text-3xl font-black text-white sm:text-5xl">
                Sua aprovação começa com a próxima questão.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-200">
                Comece agora e transforme sua preparação para o ENEM em um plano claro de evolução.
              </p>
            </div>
            <Link
              href="/register"
              data-analytics-event="cta_start_free"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-cyan-300 px-5 text-sm font-black text-slate-950 transition hover:bg-cyan-200"
            >
              Criar minha conta grátis
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-slate-950 px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 text-sm text-slate-400 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <ShieldCheck aria-hidden className="h-5 w-5 text-cyan-100" />
            <p>ENEM UP. Aplicativo web de estudos para o ENEM.</p>
          </div>
          <div className="flex flex-wrap gap-5">
            <Link href="/login" className="hover:text-white">
              Login
            </Link>
            <Link href="/register" className="hover:text-white">
              Cadastro
            </Link>
            <a href="#planos" className="hover:text-white">
              Planos
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
