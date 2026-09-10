import { BrainCircuit, Send } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireActiveSubscription } from "@/lib/auth/subscription";
import { askAIAction } from "@/modules/ai/actions";

export default async function AITutorPage() {
  const user = await requireActiveSubscription();
  const conversation = await prisma.aIConversation.findFirst({
    where: { userId: user.id, context: "STUDENT_TUTOR" },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return (
    <main className="px-6 py-8">
      <section className="mx-auto max-w-5xl">
        <div className="rounded-lg border border-white/10 bg-white/8 p-7">
          <BrainCircuit aria-hidden className="h-8 w-8 text-cyan-200" />
          <h1 className="mt-5 text-3xl font-semibold">Tutor com IA</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Versão inicial gratuita em modo local/mock. A mesma interface
            AIService permite trocar para Gemini, OpenRouter ou outro provedor
            sem expor chaves no frontend.
          </p>
        </div>

        <div className="mt-5 rounded-lg border border-white/10 bg-slate-900 p-5">
          <div className="grid max-h-[520px] gap-3 overflow-y-auto pr-1">
            {conversation?.messages.length ? (
              conversation.messages.map((message) => (
                <article
                  key={message.id}
                  className={`rounded-lg border p-4 text-sm leading-6 ${
                    message.role === "user"
                      ? "ml-auto max-w-[85%] border-cyan-300/20 bg-cyan-300/10 text-cyan-50"
                      : "mr-auto max-w-[85%] border-white/10 bg-slate-950 text-slate-200"
                  }`}
                >
                  {message.content}
                </article>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-white/15 p-8 text-center text-sm text-slate-300">
                Pergunte algo sobre estudo, questões, redação, simulados ou
                planejámento.
              </div>
            )}
          </div>
          <form action={askAIAction} className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input
              name="message"
              required
              minLength={3}
              placeholder="Ex.: como revisar matemática nesta semana?"
              className="h-12 flex-1 rounded-md border border-white/10 bg-slate-950 px-4 text-sm text-white placeholder:text-slate-500"
            />
            <button className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-cyan-300 px-5 text-sm font-semibold text-slate-950 hover:bg-cyan-200">
              <Send aria-hidden className="h-4 w-4" />
              Enviar
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
