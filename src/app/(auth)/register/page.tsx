import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthCard
      title="Criar conta"
      description="A primeira conta criada neste ambiente recebe permissão de administrador. As próximas entram como aluno."
    >
      <RegisterForm />
    </AuthCard>
  );
}
