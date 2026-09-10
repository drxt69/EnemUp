import Link from "next/link";
import { ArrowLeft, Construction } from "lucide-react";

type ModulePlaceholderProps = {
  title: string;
  description: string;
};

export function ModulePlaceholder({ title, description }: ModulePlaceholderProps) {
  return (
    <main className="px-6 py-8">
      <section className="mx-auto max-w-5xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-cyan-100 hover:text-cyan-200"
        >
          <ArrowLeft aria-hidden className="h-4 w-4" />
          Dashboard
        </Link>
        <div className="mt-10 rounded-lg border border-white/10 bg-white/8 p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-300/15 text-cyan-200">
            <Construction aria-hidden className="h-6 w-6" />
          </div>
          <h1 className="mt-6 text-3xl font-semibold">{title}</h1>
          <p className="mt-3 max-w-2xl text-slate-300">{description}</p>
        </div>
      </section>
    </main>
  );
}
