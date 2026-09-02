import { useState, type FormEvent } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { LoaderCircle, LogIn } from "lucide-react";

import { loginWithPassword } from "@/lib/auth/functions";

export function LoginForm() {
  const login = useServerFn(loginWithPassword);
  const navigate = useNavigate();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const formData = new FormData(event.currentTarget);
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await login({
        data: {
          email: String(formData.get("email") ?? ""),
          password: String(formData.get("password") ?? ""),
        },
      });
      await router.invalidate();
      await navigate({ to: result.redirectTo });
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Não foi possível entrar agora.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-off-white">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-11 w-full rounded-md border border-white/15 bg-navy/65 px-3 text-sm text-white outline-none transition-colors placeholder:text-off-white/35 focus:border-gold focus:ring-2 focus:ring-gold/25"
          placeholder="seu@email.com"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-off-white">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-11 w-full rounded-md border border-white/15 bg-navy/65 px-3 text-sm text-white outline-none transition-colors placeholder:text-off-white/35 focus:border-gold focus:ring-2 focus:ring-gold/25"
          placeholder="Sua senha"
        />
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-md border border-red/40 bg-red/10 px-3 py-2 text-sm text-white"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-gold px-4 text-sm font-semibold text-navy transition-colors hover:bg-gold-deep disabled:cursor-not-allowed disabled:opacity-65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
      >
        {isSubmitting ? (
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <LogIn className="h-4 w-4" aria-hidden />
        )}
        {isSubmitting ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
