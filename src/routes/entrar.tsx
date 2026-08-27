import { createFileRoute, redirect } from "@tanstack/react-router";

import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { getUser } from "@/lib/auth/functions";
import { getRoleHome } from "@/lib/auth/types";

export const Route = createFileRoute("/entrar")({
  loader: async () => {
    const user = await getUser();
    if (user) throw redirect({ href: getRoleHome(user.role) });
  },
  head: () => ({
    meta: [
      { title: "Entrar — MOBTV" },
      { name: "description", content: "Acesse sua conta MOBTV." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: EntrarPage,
});

function EntrarPage() {
  return (
    <AuthShell
      eyebrow="Acesso MOBTV"
      title="Entre na sua conta"
      description="Acesse campanhas, pedidos e mídias da sua empresa."
    >
      <LoginForm />
    </AuthShell>
  );
}
