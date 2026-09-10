"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/auth/session";
import { getStudentEntryPath } from "@/lib/auth/subscription";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createToken, hashToken } from "@/lib/auth/tokens";
import { checkRateLimit } from "@/lib/security/rate-limit";
import {
  type AuthActionState,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "./validators";

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function attachRole(userId: string, roleKey: "ADMIN" | "STUDENT") {
  const role = await prisma.role.findUnique({
    where: { key: roleKey },
  });

  if (!role) {
    return;
  }

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId,
        roleId: role.id,
      },
    },
    update: {},
    create: {
      userId,
      roleId: role.id,
    },
  });
}

export async function registerAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    name: getFormValue(formData, "name"),
    email: getFormValue(formData, "email"),
    password: getFormValue(formData, "password"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const rateLimit = checkRateLimit(`register:${parsed.data.email}`, 5, 60_000);
  if (!rateLimit.allowed) {
    return { ok: false, message: "Muitas tentativas. Aguarde um minuto." };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (existing) {
    return { ok: false, message: "Já existe uma conta com este e-mail." };
  }

  const userCount = await prisma.user.count();
  const role = userCount === 0 ? "ADMIN" : "STUDENT";
  const passwordHash = await hashPassword(parsed.data.password);

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role,
      profile: {
        create: {},
      },
    },
  });

  await attachRole(user.id, role);
  await createSession(user.id);

  redirect(role === "ADMIN" ? "/admin" : "/practice");
}

export async function loginAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: getFormValue(formData, "email"),
    password: getFormValue(formData, "password"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const rateLimit = checkRateLimit(`login:${parsed.data.email}`, 8, 60_000);
  if (!rateLimit.allowed) {
    return { ok: false, message: "Muitas tentativas. Aguarde um minuto." };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (!user?.passwordHash || user.status !== "ACTIVE") {
    return { ok: false, message: "E-mail ou senha inválidos." };
  }

  const validPassword = await verifyPassword(parsed.data.password, user.passwordHash);

  if (!validPassword) {
    return { ok: false, message: "E-mail ou senha inválidos." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await createSession(user.id);

  redirect(await getStudentEntryPath(user));
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function forgotPasswordAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: getFormValue(formData, "email"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const rateLimit = checkRateLimit(`forgot:${parsed.data.email}`, 3, 60_000);
  if (!rateLimit.allowed) {
    return { ok: false, message: "Muitas tentativas. Aguarde um minuto." };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (!user) {
    return {
      ok: true,
      message: "Se o e-mail existir, enviaremos instruções de recuperação.",
    };
  }

  const token = createToken();
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 1000 * 60 * 30),
    },
  });

  return {
    ok: true,
    message:
      "Token gerado para desenvolvimento local. Em produção ele será enviado por e-mail.",
    resetToken: token,
  };
}

export async function resetPasswordAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse({
    token: getFormValue(formData, "token"),
    password: getFormValue(formData, "password"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(parsed.data.token) },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return { ok: false, message: "Token inválido ou expirado." };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash: await hashPassword(parsed.data.password) },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
    prisma.session.deleteMany({
      where: { userId: resetToken.userId },
    }),
  ]);

  return {
    ok: true,
    message: "Senha atualizada. Você já pode entrar novamente.",
  };
}
