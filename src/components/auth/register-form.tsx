"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction } from "@/modules/auth/actions";
import { initialAuthState } from "@/modules/auth/validators";
import { SubmitButton } from "./submit-button";

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, initialAuthState);

  return (
    <form action={formAction} className="grid gap-4">
      <label className="grid gap-2 text-sm font-medium text-slate-200">
        Nome
        <input
          name="name"
          autoComplete="name"
          required
          className="h-12 rounded-md border border-white/10 bg-slate-950/70 px-4 text-white placeholder:text-slate-500"
          placeholder="Seu nome"
        />
      </label>
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
          autoComplete="new-password"
          required
          minLength={8}
          className="h-12 rounded-md border border-white/10 bg-slate-950/70 px-4 text-white placeholder:text-slate-500"
          placeholder="Mínimo de 8 caracteres"
        />
      </label>
      {state.message ? (
        <p className="rounded-md border border-rose-300/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
          {state.message}
        </p>
      ) : null}
      <SubmitButton pendingLabel="Criando conta...">Criar conta</SubmitButton>
      <p className="text-center text-sm text-slate-300">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-cyan-100 hover:text-cyan-200">
          Entrar
        </Link>
      </p>
    </form>
  );
}
