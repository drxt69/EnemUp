import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthCard
      title="Entrar na plataforma"
      description="Acesse seu painel de estudos, acompanhe progresso e continue sua preparação."
    >
      <LoginForm />
    </AuthCard>
  );
}
