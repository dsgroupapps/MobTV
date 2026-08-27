import { createFileRoute, redirect } from "@tanstack/react-router";

import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/auth/SignupForm";
import { getUser } from "@/lib/auth/functions";
import { getRoleHome } from "@/lib/auth/types";

export const Route = createFileRoute("/criar-conta")({
  loader: async () => {
    const user = await getUser();
    if (user) throw redirect({ href: getRoleHome(user.role) });
  },
  head: () => ({
    meta: [
      { title: "Criar conta — MOBTV" },
      { name: "description", content: "Crie sua conta de anunciante MOBTV." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CriarContaPage,
});

function CriarContaPage() {
  return (
    <AuthShell
      eyebrow="Conta de anunciante"
      title="Crie seu acesso"
      description="Novas contas recebem o perfil de anunciante."
    >
      <SignupForm />
    </AuthShell>
  );
}
