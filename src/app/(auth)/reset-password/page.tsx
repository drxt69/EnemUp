import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { token = "" } = await searchParams;

  return (
    <AuthCard
      title="Nova senha"
      description="Defina uma senha segura para recuperar o acesso a sua conta."
    >
      <ResetPasswordForm token={token} />
    </AuthCard>
  );
}
