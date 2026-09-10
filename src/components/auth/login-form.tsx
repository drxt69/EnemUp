"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/modules/auth/actions";
import { initialAuthState } from "@/modules/auth/validators";
import { SubmitButton } from "./submit-button";

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialAuthState);

  return (
    <form action={formAction} className="grid gap-4">
      <label className="grid gap-2 text-sm font-medium text-slate-200">
        E-mail
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-12 rounded-md border border-white/10 bg-slate-950/70 px-4 text-white placeholder:text-slate-500"
          placeholder="você@email.com"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-200">
        Senha
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-12 rounded-md border border-white/10 bg-slate-950/70 px-4 text-white placeholder:text-slate-500"
          placeholder="Sua senha"
        />
      </label>
      {state.message ? (
        <p className="rounded-md border border-rose-300/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
          {state.message}
        </p>
      ) : null}
      <SubmitButton pendingLabel="Entrando...">Entrar</SubmitButton>
      <div className="flex items-center justify-between text-sm text-slate-300">
        <Link href="/forgot-password" className="hover:text-cyan-100">
          Esqueci minha senha
        </Link>
        <Link href="/register" className="font-medium text-cyan-100 hover:text-cyan-200">
          Criar conta
        </Link>
      </div>
    </form>
  );
}
