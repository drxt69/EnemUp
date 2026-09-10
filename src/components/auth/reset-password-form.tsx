"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPasswordAction } from "@/modules/auth/actions";
import { initialAuthState } from "@/modules/auth/validators";
import { SubmitButton } from "./submit-button";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(resetPasswordAction, initialAuthState);

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="token" value={token} />
      <label className="grid gap-2 text-sm font-medium text-slate-200">
        Nova senha
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="h-12 rounded-md border border-white/10 bg-slate-950/70 px-4 text-white placeholder:text-slate-500"
          placeholder="Minimo de 8 caracteres"
        />
      </label>
      {state.message ? (
        <p
          className={`rounded-md border px-3 py-2 text-sm ${
            state.ok
              ? "border-emerald-300/20 bg-emerald-500/10 text-emerald-100"
              : "border-rose-300/20 bg-rose-500/10 text-rose-100"
          }`}
        >
          {state.message}
        </p>
      ) : null}
      <SubmitButton pendingLabel="Atualizando...">Atualizar senha</SubmitButton>
      <Link href="/login" className="text-center text-sm text-cyan-100 hover:text-cyan-200">
        Entrar
      </Link>
    </form>
  );
}
