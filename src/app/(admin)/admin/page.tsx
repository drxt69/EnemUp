import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  CreditCard,
  FileText,
  Library,
  Lock,
  PenTool,
  Settings,
  ShieldCheck,
  TimerReset,
  TrendingUp,
  Unlock,
  Users,
} from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  grantUserSubscriptionAction,
  revokeUserSubscriptionAction,
  updateUserAccessAction,
} from "@/modules/admin/actions";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function formatDate(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    ACTIVE: "Liberado",
    BLOCKED: "Bloqueado",
    SUSPENDED: "Suspenso",
  };

  return labels[status] ?? status;
}

function statusClass(status: string) {
  if (status === "ACTIVE") {
    return "border-emerald-300/20 bg-emerald-300/10 text-emerald-100";
  }

  return "border-rose-300/20 bg-rose-300/10 text-rose-100";
}

export default async function AdminPage() {
  const user = await requireRole("ADMIN");
  const [
    userCount,
    activeUserCount,
    blockedUserCount,
    questionCount,
    publishedQuestionCount,
    simulationCount,
    essayCount,
    materialCount,
    activeSubscriptionCount,
    paymentCount,
    paidRevenue,
    monthlyRevenue,
    recentUsers,
    recentPayments,
    recentLogs,
    areaQuestionCounts,
    subjectAnswerCounts,
    activePlans,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { status: "BLOCKED" } }),
    prisma.question.count(),
    prisma.question.count({ where: { isPublished: true } }),
    prisma.simulation.count(),
    prisma.essaySubmission.count(),
    prisma.material.count(),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.payment.count(),
    prisma.payment.aggregate({
      where: { status: "PAID" },
      _sum: { amountCents: true },
    }),
    prisma.payment.aggregate({
      where: {
        status: "PAID",
        paidAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _sum: { amountCents: true },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: {
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { plan: true },
        },
        _count: {
          select: {
            studentAnswers: true,
            essaySubmissions: true,
            simulationRuns: true,
          },
        },
      },
    }),
    prisma.payment.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { user: true } }),
    prisma.adminLog.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.question.groupBy({
      by: ["areaId"],
      where: { isPublished: true },
      _count: { _all: true },
      orderBy: { _count: { areaId: "desc" } },
    }),
    prisma.studentAnswer.groupBy({
      by: ["questionId"],
      _count: { _all: true },
      orderBy: { _count: { questionId: "desc" } },
      take: 60,
    }),
    prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { priceCents: "asc" },
    }),
  ]);

  const [areas, popularQuestions] = await Promise.all([
    prisma.area.findMany({ select: { id: true, name: true } }),
    prisma.question.findMany({
      where: { id: { in: subjectAnswerCounts.map((item) => item.questionId) } },
      select: {
        id: true,
        subject: { select: { name: true } },
      },
    }),
  ]);

  const areaById = new Map(areas.map((area) => [area.id, area.name]));
  const answersByQuestionId = new Map(
    subjectAnswerCounts.map((item) => [item.questionId, item._count._all]),
  );
  const subjectEngagement = new Map<string, number>();

  for (const question of popularQuestions) {
    subjectEngagement.set(
      question.subject.name,
      (subjectEngagement.get(question.subject.name) ?? 0) +
        (answersByQuestionId.get(question.id) ?? 0),
    );
  }

  const topSubjects = [...subjectEngagement.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const totalRevenueCents = paidRevenue._sum.amountCents ?? 0;
  const monthlyRevenueCents = monthlyRevenue._sum.amountCents ?? 0;
  const conversionRate = userCount > 0 ? Math.round((activeSubscriptionCount / userCount) * 100) : 0;
  const publishedRate = questionCount > 0 ? Math.round((publishedQuestionCount / questionCount) * 100) : 0;

  const cards = [
    ["Usuários totais", userCount, Users, `${activeUserCount} liberados`],
    ["Contas bloqueadas", blockedUserCount, Lock, "sem acesso ao app"],
    ["Receita total", formatCurrency(totalRevenueCents), TrendingUp, `${formatCurrency(monthlyRevenueCents)} no mês`],
    ["Assinaturas ativas", activeSubscriptionCount, CreditCard, `${conversionRate}% dos usuários`],
    ["Questões publicadas", publishedQuestionCount, FileText, `${publishedRate}% do banco`],
    ["Simulados", simulationCount, TimerReset, "treinos disponíveis"],
    ["Redações", essayCount, PenTool, "envios recebidos"],
    ["Materiais", materialCount, Library, `${paymentCount} pagamentos`],
  ] as const;

  return (
    <main className="px-6 py-8">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-lg border border-white/10 bg-white/8 p-8">
          <Settings aria-hidden className="h-8 w-8 text-cyan-200" />
          <h1 className="mt-6 text-3xl font-semibold">Dashboard executivo</h1>
          <p className="mt-3 max-w-2xl text-slate-300">
            Logado como {user.email}. Controle crescimento, receita, conteúdo,
            engajamento e acesso das contas da plataforma.
          </p>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(([label, value, Icon, detail]) => (
            <article key={label} className="rounded-lg border border-white/10 bg-white/8 p-5">
              <Icon aria-hidden className="h-6 w-6 text-cyan-200" />
              <p className="mt-4 text-3xl font-semibold text-white">{value}</p>
              <p className="mt-1 text-sm text-slate-400">{label}</p>
              <p className="mt-3 text-xs text-slate-500">{detail}</p>
            </article>
          ))}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-lg border border-white/10 bg-slate-900 p-6">
            <div className="flex items-center gap-3">
              <BarChart3 aria-hidden className="h-5 w-5 text-cyan-200" />
              <h2 className="text-xl font-semibold text-white">Operação em tempo real</h2>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                ["Liberados", activeUserCount, "text-emerald-100"],
                ["Bloqueados", blockedUserCount, "text-rose-100"],
                ["Assinantes", activeSubscriptionCount, "text-cyan-100"],
              ].map(([label, value, color]) => (
                <div key={label as string} className="rounded-md border border-white/10 bg-slate-950/50 p-4">
                  <p className={`text-2xl font-semibold ${color}`}>{value}</p>
                  <p className="mt-1 text-xs text-slate-400">{label}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 space-y-4">
              {areaQuestionCounts.map((item) => {
                const percent = publishedQuestionCount > 0 ? Math.round((item._count._all / publishedQuestionCount) * 100) : 0;

                return (
                  <div key={item.areaId}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-white">{areaById.get(item.areaId) ?? "Área"}</span>
                      <span className="text-slate-400">{item._count._all} questões</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-cyan-300" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-lg border border-white/10 bg-slate-900 p-6">
            <div className="flex items-center gap-3">
              <ShieldCheck aria-hidden className="h-5 w-5 text-emerald-200" />
              <h2 className="text-xl font-semibold text-white">Sinais executivos</h2>
            </div>
            <div className="mt-4 grid gap-3">
              <div className="rounded-md border border-emerald-300/15 bg-emerald-300/10 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-100">
                  <CheckCircle2 aria-hidden className="h-4 w-4" />
                  Saúde comercial
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {formatCurrency(totalRevenueCents)} confirmados, com {activeSubscriptionCount} assinatura(s) ativa(s).
                </p>
              </div>
              <div className="rounded-md border border-amber-300/15 bg-amber-300/10 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-100">
                  <AlertTriangle aria-hidden className="h-4 w-4" />
                  Controle de acesso
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Contas bloqueadas perdem as sessões imediatamente e não acessam a área do aluno.
                </p>
              </div>
              {topSubjects.length > 0 ? (
                <div className="rounded-md border border-white/10 bg-slate-950/50 p-4">
                  <p className="text-sm font-semibold text-white">Disciplinas mais praticadas</p>
                  <div className="mt-3 grid gap-2">
                    {topSubjects.map(([subject, total]) => (
                      <div key={subject} className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-slate-300">{subject}</span>
                        <span className="text-cyan-100">{total} respostas</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </div>

        <section id="users" className="mt-5 rounded-lg border border-white/10 bg-slate-900 p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-xl font-semibold text-white">Controle de contas</h2>
              <p className="mt-2 text-sm text-slate-400">
                Libere ou bloqueie o acesso de alunos sem apagar histórico, progresso ou pagamentos.
              </p>
            </div>
            <p className="text-sm text-slate-400">{recentUsers.length} usuários mais recentes</p>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[860px] border-separate border-spacing-y-2 text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">Conta</th>
                  <th className="px-4 py-2">Perfil</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Assinatura</th>
                  <th className="px-4 py-2">Atividade</th>
                  <th className="px-4 py-2 text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((item) => {
                  const subscription =
                    item.subscriptions.find(
                      (candidate) =>
                        candidate.status === "ACTIVE" &&
                        (!candidate.currentPeriodEnd || candidate.currentPeriodEnd > new Date()),
                    ) ?? item.subscriptions[0];
                  const hasPremiumAccess =
                    subscription?.status === "ACTIVE" &&
                    (!subscription.currentPeriodEnd || subscription.currentPeriodEnd > new Date());
                  const isCurrentAdmin = item.id === user.id;
                  const nextStatus = item.status === "ACTIVE" ? "BLOCKED" : "ACTIVE";
                  const ActionIcon = item.status === "ACTIVE" ? Lock : Unlock;

                  return (
                    <tr key={item.id} className="bg-slate-950/60">
                      <td className="rounded-l-md border-y border-l border-white/10 px-4 py-4">
                        <p className="font-semibold text-white">{item.name ?? "Sem nome"}</p>
                        <p className="mt-1 text-xs text-slate-400">{item.email}</p>
                      </td>
                      <td className="border-y border-white/10 px-4 py-4 text-slate-300">
                        {item.role}
                      </td>
                      <td className="border-y border-white/10 px-4 py-4">
                        <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${statusClass(item.status)}`}>
                          {statusLabel(item.status)}
                        </span>
                      </td>
                      <td className="border-y border-white/10 px-4 py-4 text-slate-300">
                        <div className="grid gap-2">
                          <span>
                            {subscription ? `${subscription.plan.name} | ${subscription.status}` : "Sem assinatura"}
                          </span>
                          {hasPremiumAccess ? (
                            <form action={revokeUserSubscriptionAction}>
                              <input type="hidden" name="userId" value={item.id} />
                              <button
                                type="submit"
                                className="inline-flex h-8 items-center justify-center rounded-md border border-rose-300/25 px-3 text-xs font-semibold text-rose-100 hover:border-rose-200"
                              >
                                Remover premium
                              </button>
                            </form>
                          ) : (
                            <form action={grantUserSubscriptionAction} className="flex flex-wrap gap-2">
                              <input type="hidden" name="userId" value={item.id} />
                              <select
                                name="planId"
                                className="h-8 rounded-md border border-white/10 bg-slate-950 px-2 text-xs text-white"
                                defaultValue={activePlans[0]?.id}
                              >
                                {activePlans.map((plan) => (
                                  <option key={plan.id} value={plan.id}>
                                    {plan.name}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="submit"
                                disabled={activePlans.length === 0}
                                className="inline-flex h-8 items-center justify-center rounded-md border border-emerald-300/25 px-3 text-xs font-semibold text-emerald-100 hover:border-emerald-200 disabled:cursor-not-allowed disabled:opacity-45"
                              >
                                Liberar premium
                              </button>
                            </form>
                          )}
                        </div>
                      </td>
                      <td className="border-y border-white/10 px-4 py-4 text-slate-300">
                        {item._count.studentAnswers} respostas | {item._count.simulationRuns} simulados | {item._count.essaySubmissions} redações
                      </td>
                      <td className="rounded-r-md border-y border-r border-white/10 px-4 py-4 text-right">
                        <form action={updateUserAccessAction}>
                          <input type="hidden" name="userId" value={item.id} />
                          <input type="hidden" name="status" value={nextStatus} />
                          <button
                            type="submit"
                            disabled={isCurrentAdmin}
                            className="inline-flex h-10 items-center gap-2 rounded-md border border-white/15 px-3 text-sm font-medium text-white transition hover:border-cyan-200 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-45"
                            title={isCurrentAdmin ? "Você não pode bloquear sua própria conta" : undefined}
                          >
                            <ActionIcon aria-hidden className="h-4 w-4" />
                            {item.status === "ACTIVE" ? "Bloquear" : "Liberar"}
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <section className="rounded-lg border border-white/10 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold text-white">Pagamentos recentes</h2>
            <div className="mt-4 grid gap-3">
              {recentPayments.length > 0 ? recentPayments.map((payment) => (
                <div key={payment.id} className="rounded-md border border-white/10 bg-slate-950/50 p-4 text-sm">
                  <p className="font-medium text-white">{payment.user.email}</p>
                  <p className="mt-1 text-slate-400">{payment.status} | R$ {(payment.amountCents / 100).toFixed(2)}</p>
                </div>
              )) : (
                <p className="rounded-md border border-dashed border-white/15 p-4 text-sm text-slate-300">Nenhum pagamento ainda.</p>
              )}
            </div>
          </section>

          <section id="content" className="rounded-lg border border-white/10 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold text-white">Logs administrativos</h2>
            <div className="mt-4 grid gap-3">
              {recentLogs.length > 0 ? recentLogs.map((log) => (
                <div key={log.id} className="rounded-md border border-white/10 bg-slate-950/50 p-4 text-sm">
                  <p className="font-medium text-white">{log.action}</p>
                  <p className="mt-1 text-slate-400">
                    {log.entityType ?? "Sistema"} | {formatDate(log.createdAt)}
                  </p>
                </div>
              )) : (
                <p className="rounded-md border border-dashed border-white/15 p-4 text-sm text-slate-300">Sem logs recentes.</p>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
