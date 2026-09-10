import Link from "next/link";
import { BarChart3, FileDown, LogOut, Settings, Users } from "lucide-react";
import { AppLogo } from "@/components/brand/app-logo";
import { requireRole } from "@/lib/auth/session";
import { logoutAction } from "@/modules/auth/actions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("ADMIN");

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/80 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4">
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <AppLogo context="Administração" size="sm" />
              <p className="mt-1 hidden truncate text-sm text-slate-300 sm:block">{user.email}</p>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md border border-white/15 px-3 text-sm font-medium text-slate-100 transition hover:border-cyan-200 hover:text-cyan-100 sm:px-4"
              >
                <LogOut aria-hidden className="h-4 w-4" />
                Sair
              </button>
            </form>
          </div>
          <nav className="flex gap-2 overflow-x-auto pb-1">
            {[
              ["/admin", "Visão geral", BarChart3],
              ["/admin#users", "Usuários", Users],
              ["/admin#content", "Conteúdo", Settings],
              ["/admin/enem-sources", "Fontes ENEM", FileDown],
            ].map(([href, label, Icon]) => (
              <Link
                key={href as string}
                href={href as string}
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-slate-200 transition hover:border-cyan-200 hover:text-cyan-100"
              >
                <Icon aria-hidden className="h-4 w-4" />
                {label as string}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
