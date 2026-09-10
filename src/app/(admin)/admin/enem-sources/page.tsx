import Link from "next/link";
import { ExternalLink, FileDown, ShieldCheck } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const sources = [
  {
    title: "Provas e gabaritos oficiais do ENEM",
    href: "https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos",
    description:
      "Página oficial do INEP/Gov.br com provas e gabaritos por ano, dia, cor de caderno e aplicação.",
  },
  {
    title: "Microdados do ENEM",
    href: "https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/enem",
    description:
      "Dados abertos oficiais para análises e metadados do exame.",
  },
];

export default async function EnemSourcesPage() {
  await requireRole("ADMIN");
  const [importSources, drafts] = await Promise.all([
    prisma.enemImportSource.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.questionImportDraft.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: { source: true },
    }),
  ]);

  return (
    <main className="px-6 py-8">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-lg border border-white/10 bg-white/8 p-7">
          <ShieldCheck aria-hidden className="h-8 w-8 text-cyan-200" />
          <h1 className="mt-5 text-3xl font-semibold">
            Importação legal de questões ENEM
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            O sistema está pronto para armazenar todas as questões, mas a carga
            completa deve vir das fontes oficiais e passar por revisão antes de
            publicar para alunos.
          </p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {sources.map((source) => (
            <article key={source.href} className="rounded-lg border border-white/10 bg-slate-900 p-6">
              <FileDown aria-hidden className="h-7 w-7 text-cyan-200" />
              <h2 className="mt-4 text-xl font-semibold text-white">
                {source.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {source.description}
              </p>
              <Link
                href={source.href}
                target="_blank"
                className="mt-5 inline-flex h-11 items-center gap-2 rounded-md bg-cyan-300 px-4 text-sm font-semibold text-slate-950 hover:bg-cyan-200"
              >
                Abrir fonte oficial
                <ExternalLink aria-hidden className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>

        <section className="mt-5 rounded-lg border border-white/10 bg-white/8 p-6">
          <h2 className="text-xl font-semibold text-white">Fila recomendada</h2>
          <ol className="mt-4 grid gap-3 text-sm leading-6 text-slate-300">
            <li>1. Baixar PDF e gabarito oficial.</li>
            <li>2. Extrair enunciado, textos de apoio, imagens e alternativas.</li>
            <li>3. Conferir gabarito, área, disciplina, assunto e dificuldade.</li>
            <li>4. Marcar como revisada e publicar no banco de questões.</li>
          </ol>
        </section>

        <section className="mt-5 rounded-lg border border-white/10 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold text-white">Comando automatico</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Para baixar um lote pequeno e gerar rascunhos de revisão:
          </p>
          <pre className="mt-4 overflow-x-auto rounded-md bg-slate-950 p-4 text-sm text-cyan-100">
            npm run enem:import
          </pre>
          <p className="mt-3 text-xs leading-5 text-slate-400">
            O comando usa limite baixo por segurança. Para importação completa,
            aumente os limites gradualmente e revise os rascunhos antes de
            publicar.
          </p>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <section className="rounded-lg border border-white/10 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold text-white">Fontes importadas</h2>
            <div className="mt-4 grid gap-3">
              {importSources.length > 0 ? (
                importSources.map((source) => (
                  <article key={source.id} className="rounded-md border border-white/10 bg-slate-950/50 p-4">
                    <p className="font-medium text-white">{source.title}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {source.year ?? "Sem ano"} | {source.assetType} | {source.status}
                    </p>
                  </article>
                ))
              ) : (
                <p className="rounded-md border border-dashed border-white/15 p-4 text-sm text-slate-300">
                  Nenhuma fonte importada ainda.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-white/10 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold text-white">Rascunhos para revisão</h2>
            <div className="mt-4 grid gap-3">
              {drafts.length > 0 ? (
                drafts.map((draft) => (
                  <article key={draft.id} className="rounded-md border border-white/10 bg-slate-950/50 p-4">
                    <p className="text-sm font-medium text-white">
                      Questão {draft.questionNumber ?? "sem número"} | {draft.status}
                    </p>
                    <p className="mt-2 line-clamp-4 text-xs leading-5 text-slate-400">
                      {draft.rawText}
                    </p>
                  </article>
                ))
              ) : (
                <p className="rounded-md border border-dashed border-white/15 p-4 text-sm text-slate-300">
                  Nenhum rascunho extraido ainda.
                </p>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
