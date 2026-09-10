import { CreditCard, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { getInfinitePayCheckoutUrl } from "@/lib/payments/infinitepay";
import {
  cancelSubscriptionAction,
  startInfinitePayCheckoutAction,
} from "@/modules/payments/actions";

type BillingPageProps = {
  searchParams: Promise<{
    required?: string;
  }>;
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const user = await requireUser();
  const params = await searchParams;
  const [plans, subscriptions, payments] = await Promise.all([
    prisma.plan.findMany({ where: { isActive: true }, orderBy: { priceCents: "asc" } }),
    prisma.subscription.findMany({
      where: { userId: user.id },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.payment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);
  const activeSubscription = subscriptions.find(
    (item) =>
      item.status === "ACTIVE" &&
      (!item.currentPeriodEnd || item.currentPeriodEnd > new Date()),
  );

  return (
    <main className="px-6 py-8">
      <section className="mx-auto max-w-7xl">
        {params.required === "subscription" ? (
          <div className="mb-5 rounded-lg border border-amber-300/25 bg-amber-300/10 p-5">
            <p className="text-sm font-semibold text-amber-50">
              Assinatura necessária para liberar o acesso.
            </p>
            <p className="mt-2 text-sm leading-6 text-amber-50/85">
              Escolha um plano e finalize o pagamento na InfinitePay. O conteúdo
              será liberado depois da confirmação do pagamento.
            </p>
          </div>
        ) : null}

        {params.required === "free-limit" ? (
          <div className="mb-5 rounded-lg border border-cyan-300/25 bg-cyan-300/10 p-5">
            <p className="text-sm font-semibold text-cyan-50">
              Você usou as 15 questões gratuitas.
            </p>
            <p className="mt-2 text-sm leading-6 text-cyan-50/85">
              Assine um plano para continuar resolvendo questões, acessar
              simulados, redação com IA, tutor e plano de estudos.
            </p>
          </div>
        ) : null}

        <div className="rounded-lg border border-white/10 bg-white/8 p-7">
          <CreditCard aria-hidden className="h-8 w-8 text-cyan-200" />
          <h1 className="mt-5 text-3xl font-semibold">Assinatura e pagamentos</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Assinatura paga desde o início, com checkout InfinitePay, webhook,
            histórico e controle de acesso.
          </p>
        </div>

        {activeSubscription ? (
          <section className="mt-5 rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-6">
            <ShieldCheck aria-hidden className="h-7 w-7 text-emerald-100" />
            <h2 className="mt-4 text-xl font-semibold text-white">
              Plano atual: {activeSubscription.plan.name}
            </h2>
            <p className="mt-2 text-sm text-emerald-50">
              Status: {activeSubscription.status}. Válido até{" "}
              {activeSubscription.currentPeriodEnd?.toLocaleDateString("pt-BR") ?? "período atual"}.
            </p>
            <form action={cancelSubscriptionAction} className="mt-5">
              <input type="hidden" name="subscriptionId" value={activeSubscription.id} />
              <button className="h-10 rounded-md border border-white/20 px-4 text-sm font-medium text-white hover:border-white">
                Cancelar assinatura
              </button>
            </form>
          </section>
        ) : null}

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {plans.map((plan) => {
            const checkoutUrl = getInfinitePayCheckoutUrl(plan.key);

            return (
            <article key={plan.id} className="rounded-lg border border-white/10 bg-white/8 p-6">
              <h2 className="text-xl font-semibold text-white">{plan.name}</h2>
              <p className="mt-2 text-sm text-slate-300">{plan.description}</p>
              <p className="mt-6 text-4xl font-semibold text-white">
                {formatCurrency(plan.priceCents)}
              </p>
              <p className="mt-2 text-sm text-slate-400">
                {plan.billingInterval === "YEAR" ? "por ano" : "por mês"} | acesso após pagamento aprovado
              </p>
              {checkoutUrl ? (
                <form action={startInfinitePayCheckoutAction} className="mt-6">
                  <input type="hidden" name="planId" value={plan.id} />
                  <button className="inline-flex h-11 w-full items-center justify-center rounded-md bg-cyan-300 px-4 text-sm font-semibold text-slate-950 hover:bg-cyan-200">
                    Assinar com InfinitePay
                  </button>
                </form>
              ) : (
                <div className="mt-6 rounded-md border border-dashed border-white/15 p-4 text-sm text-slate-300">
                  Checkout deste plano em configuração.
                </div>
              )}
            </article>
            );
          })}
        </div>

        <section className="mt-5 rounded-lg border border-white/10 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold text-white">Histórico</h2>
          <div className="mt-4 grid gap-3">
            {payments.length > 0 ? (
              payments.map((payment) => (
                <div key={payment.id} className="rounded-md border border-white/10 bg-slate-950/50 p-4 text-sm">
                  <p className="font-medium text-white">
                    {formatCurrency(payment.amountCents)} | {payment.status}
                  </p>
                  <p className="mt-1 text-slate-400">{payment.provider}</p>
                </div>
              ))
            ) : (
              <p className="rounded-md border border-dashed border-white/15 p-5 text-sm text-slate-300">
                Nenhum pagamento registrado ainda.
              </p>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
