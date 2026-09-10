import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome."),
  email: z.string().trim().email("Informe um e-mail válido.").toLowerCase(),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido.").toLowerCase(),
  password: z.string().min(1, "Informe sua senha."),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido.").toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20, "Token inválido."),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
});

export type AuthActionState = {
  ok: boolean;
  message: string;
  resetToken?: string;
};

export const initialAuthState: AuthActionState = {
  ok: false,
  message: "",
};
