"use client";

import Link from "next/link";
import { useActionState } from "react";
import { forgotPasswordAction } from "@/modules/auth/actions";
import { initialAuthState } from "@/modules/auth/validators";
import { SubmitButton } from "./submit-button";

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(forgotPasswordAction, initialAuthState);

  return (
    <form action={formAction} className="grid gap-4">
      <label className="grid gap-2 text-sm font-medium text-slate-200">
        E-mail da conta
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-12 rounded-md border border-white/10 bg-slate-950/70 px-4 text-white placeholder:text-slate-500"
          placeholder="você@email.com"
        />
      </label>
      {state.message ? (
        <div className="rounded-md border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-sm text-cyan-50">
          <p>{state.message}</p>
          {state.resetToken ? (
            <Link
              href={`/reset-password?token=${state.resetToken}`}
              className="mt-2 block font-medium text-cyan-100 hover:text-cyan-200"
            >
              Abrir redefinicao local
            </Link>
          ) : null}
        </div>
      ) : null}
      <SubmitButton pendingLabel="Gerando...">Recuperar senha</SubmitButton>
      <Link href="/login" className="text-center text-sm text-cyan-100 hover:text-cyan-200">
        Voltar para login
      </Link>
    </form>
  );
}
