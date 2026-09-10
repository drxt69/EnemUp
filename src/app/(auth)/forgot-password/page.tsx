import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Recuperar senha"
      description="No desenvolvimento local, o token aparece na tela. Em produção ele será enviado por e-mail."
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
