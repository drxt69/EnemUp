import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <section className="w-full max-w-md rounded-lg border border-white/10 bg-white/8 p-8 shadow-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">
          404
        </p>
        <h1 className="mt-3 text-2xl font-semibold">Página não encontrada</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          O endereço acessado não existe ou ainda será criado em uma etapa
          futura.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-md bg-cyan-300 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
        >
          <ArrowLeft aria-hidden className="h-4 w-4" />
          Voltar ao inicio
        </Link>
      </section>
    </main>
  );
}
