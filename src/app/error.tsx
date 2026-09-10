"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <section className="w-full max-w-md rounded-lg border border-white/10 bg-white/8 p-8 shadow-2xl">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-rose-500/15 text-rose-200">
          <AlertTriangle aria-hidden className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold">Algo saiu do fluxo.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          A plataforma encontrou um erro inesperado. Tente novamente; se
          persistir, o registro tecnico ajuda a investigar.
        </p>
        {error.digest ? (
          <p className="mt-4 rounded-md bg-black/30 px-3 py-2 font-mono text-xs text-slate-300">
            Digest: {error.digest}
          </p>
        ) : null}
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-md bg-cyan-300 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
        >
          <RotateCcw aria-hidden className="h-4 w-4" />
          Tentar novamente
        </button>
      </section>
    </main>
  );
}
