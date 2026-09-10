import assert from "node:assert/strict";
import test from "node:test";
import { loginSchema, registerSchema, resetPasswordSchema } from "../src/modules/auth/validators";

test("registerSchema accepts a valid account", () => {
  const result = registerSchema.safeParse({
    name: "Aluno Teste",
    email: "ALUNO@EXEMPLO.COM",
    password: "senha1234",
  });

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.email, "aluno@exemplo.com");
  }
});

test("registerSchema rejects weak passwords", () => {
  const result = registerSchema.safeParse({
    name: "Aluno",
    email: "aluno@exemplo.com",
    password: "123",
  });

  assert.equal(result.success, false);
});

test("loginSchema rejects invalid email", () => {
  const result = loginSchema.safeParse({
    email: "email-invalido",
    password: "senha1234",
  });

  assert.equal(result.success, false);
});

test("resetPasswordSchema requires a token and strong password", () => {
  const result = resetPasswordSchema.safeParse({
    token: "token-local-com-tamanho-suficiente",
    password: "novaSenha123",
  });

  assert.equal(result.success, true);
});
