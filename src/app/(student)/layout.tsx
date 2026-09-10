import Link from "next/link";
import { BarChart3, ClipboardList, CreditCard, FileText, Gamepad2, GraduationCap, Library, LogOut, PenTool, TimerReset } from "lucide-react";
import { AppLogo } from "@/components/brand/app-logo";
import { requireUser } from "@/lib/auth/session";
import { logoutAction } from "@/modules/auth/actions";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/practice", label: "Missão", icon: Gamepad2 },
  { href: "/questions", label: "Questões", icon: ClipboardList },
  { href: "/simulations", label: "Simulados", icon: TimerReset },
  { href: "/essays", label: "Redação", icon: PenTool },
  { href: "/study-plan", label: "Plano", icon: FileText },
  { href: "/study-methods", label: "Métodos", icon: GraduationCap },
  { href: "/materials", label: "Materiais", icon: Library },
  { href: "/billing", label: "Assinatura", icon: CreditCard },
];

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/80 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4">
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <AppLogo context="Área do aluno" size="sm" />
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
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-slate-200 transition hover:border-cyan-200 hover:text-cyan-100"
                >
                  <Icon aria-hidden className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
