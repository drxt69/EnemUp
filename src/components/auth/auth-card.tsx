import Link from "next/link";
import { AppLogo } from "@/components/brand/app-logo";

type AuthCardProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.2),transparent_34rem),linear-gradient(135deg,#020617_0%,#0f172a_55%,#111827_100%)] px-6 py-10 text-white">
      <section className="w-full max-w-md rounded-lg border border-white/10 bg-white/8 p-8 shadow-2xl backdrop-blur">
        <Link href="/" aria-label="ENEM UP">
          <AppLogo />
        </Link>
        <h1 className="mt-8 text-3xl font-semibold">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">{description}</p>
        <div className="mt-8">{children}</div>
      </section>
    </main>
  );
}
