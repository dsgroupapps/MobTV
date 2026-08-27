import { useState } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { LoaderCircle, LogOut } from "lucide-react";

import { Logo } from "@/components/site/Logo";
import { logout } from "@/lib/auth/functions";
import type { AuthUser } from "@/lib/auth/types";

type AuthenticatedPlaceholderProps = {
  user: AuthUser;
  area: "anunciante" | "administrativa";
};

export function AuthenticatedPlaceholder({ user, area }: AuthenticatedPlaceholderProps) {
  const signOut = useServerFn(logout);
  const navigate = useNavigate();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogout() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await signOut();
      await router.invalidate();
      await navigate({ to: result.redirectTo });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-off-white text-ink">
      <header className="border-b border-white/10 bg-navy text-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-6">
          <Logo variant="light" className="h-9" />
          <button
            type="button"
            onClick={handleLogout}
            disabled={isSubmitting}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-white/20 px-4 text-sm font-semibold transition-colors hover:border-gold hover:text-gold disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            {isSubmitting ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <LogOut className="h-4 w-4" aria-hidden />
            )}
            Sair
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <p className="font-mono text-xs font-medium uppercase text-gold-deep">/ Área {area}</p>
        <h1 className="mt-3 font-display text-3xl font-bold text-navy sm:text-4xl">
          Olá, {user.name}
        </h1>
        <p className="mt-3 max-w-2xl text-ink-soft">
          Sua sessão MOBTV está ativa e protegida para o perfil {user.role}.
        </p>
      </section>
    </main>
  );
}
