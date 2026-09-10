import Link from "next/link";
import { Download, FileText, Sparkles } from "lucide-react";
import { requireActiveSubscription } from "@/lib/auth/subscription";
import { prisma } from "@/lib/prisma";
import { generatePersonalizedStudyPdfAction } from "@/modules/materials/actions";

type MaterialsPageProps = {
  searchParams: Promise<{
    generated?: string;
  }>;
};

export default async function MaterialsPage({ searchParams }: MaterialsPageProps) {
  await requireActiveSubscription();
  const params = await searchParams;
  const generatedPdf =
    params.generated?.startsWith("/materials/generated/") && params.generated.endsWith(".pdf")
      ? params.generated
      : null;
  const materials = await prisma.material.findMany({
    where: { isPublished: true },
    include: {
      topic: { include: { subject: true } },
      pdfs: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="px-6 py-8">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-lg border border-white/10 bg-white/8 p-7">
          <FileText aria-hidden className="h-8 w-8 text-cyan-200" />
          <h1 className="mt-5 text-3xl font-semibold">Materiais e PDFs</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Baixe materiais produzidos pela administração para revisão e apoio
            aos estudos.
          </p>
        </div>

        {generatedPdf ? (
          <div className="mt-5 rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-5">
            <p className="font-semibold text-emerald-50">Seu PDF personalizado ficou pronto.</p>
            <Link
              href={generatedPdf}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex h-11 items-center gap-2 rounded-md bg-emerald-200 px-4 text-sm font-semibold text-slate-950 hover:bg-emerald-100"
            >
              <Download aria-hidden className="h-4 w-4" />
              Baixar plano personalizado
            </Link>
          </div>
        ) : null}

        <section className="mt-5 rounded-lg border border-white/10 bg-slate-900 p-6">
          <div className="flex items-center gap-3">
            <Sparkles aria-hidden className="h-6 w-6 text-cyan-200" />
            <div>
              <h2 className="text-xl font-semibold text-white">PDF personalizado com IA</h2>
              <p className="mt-1 text-sm text-slate-400">
                Responda ao questionário e receba um plano de estudo sob medida.
              </p>
            </div>
          </div>
          <form action={generatePersonalizedStudyPdfAction} className="mt-5 grid gap-4 lg:grid-cols-2">
            <label className="grid gap-2 text-sm text-slate-300">
              Qual é seu principal objetivo?
              <input name="objective" required className="h-11 rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white" placeholder="Ex.: subir nota em matemática, passar em medicina..." />
            </label>
            <label className="grid gap-2 text-sm text-slate-300">
              Quanto tempo você consegue estudar por dia?
              <select name="dailyTime" required className="h-11 rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white">
                <option value="30 minutos por dia">30 minutos por dia</option>
                <option value="1 hora por dia">1 hora por dia</option>
                <option value="2 horas por dia">2 horas por dia</option>
                <option value="3 horas ou mais por dia">3 horas ou mais por dia</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm text-slate-300">
              Quais disciplinas mais precisam de atenção?
              <input name="subjects" required className="h-11 rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white" placeholder="Ex.: matemática, física e redação" />
            </label>
            <label className="grid gap-2 text-sm text-slate-300">
              Qual é sua maior dificuldade hoje?
              <select name="difficulty" required className="h-11 rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white">
                <option value="manter rotina">Manter rotina</option>
                <option value="interpretar enunciados">Interpretar enunciados</option>
                <option value="lembrar conteúdo">Lembrar conteúdo</option>
                <option value="controlar tempo de prova">Controlar tempo de prova</option>
                <option value="corrigir os próprios erros">Corrigir os próprios erros</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm text-slate-300">
              Como você aprende melhor?
              <select name="learningStyle" required className="h-11 rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white">
                <option value="resolvendo questões">Resolvendo questões</option>
                <option value="vendo exemplos resolvidos">Vendo exemplos resolvidos</option>
                <option value="fazendo resumos curtos">Fazendo resumos curtos</option>
                <option value="explicando em voz alta">Explicando em voz alta</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm text-slate-300">
              Quando você pretende fazer a prova?
              <input name="deadline" required className="h-11 rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white" placeholder="Ex.: ENEM deste ano, próximo ano..." />
            </label>
            <label className="grid gap-2 text-sm text-slate-300 lg:col-span-2">
              Como é sua rotina atual?
              <textarea name="routine" rows={3} className="rounded-md border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white" placeholder="Ex.: estudo à noite, trabalho de dia, tenho pouco tempo..." />
            </label>
            <label className="grid gap-2 text-sm text-slate-300">
              Qual é sua confiança atual?
              <select name="confidence" required className="h-11 rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white">
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
              </select>
            </label>
            <button className="mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-md bg-cyan-300 px-4 text-sm font-semibold text-slate-950 hover:bg-cyan-200">
              <FileText aria-hidden className="h-4 w-4" />
              Gerar PDF personalizado
            </button>
          </form>
        </section>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {materials.map((material) => (
            <article key={material.id} className="rounded-lg border border-white/10 bg-white/8 p-6">
              <h2 className="text-xl font-semibold text-white">{material.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">{material.description}</p>
              <p className="mt-3 text-xs text-slate-400">
                {material.topic?.subject.name ?? "Geral"}
              </p>
              {material.pdfs.map((pdf) => (
                <Link
                  key={pdf.id}
                  href={pdf.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex h-11 items-center gap-2 rounded-md bg-cyan-300 px-4 text-sm font-semibold text-slate-950 hover:bg-cyan-200"
                >
                  <Download aria-hidden className="h-4 w-4" />
                  Baixar PDF
                </Link>
              ))}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
