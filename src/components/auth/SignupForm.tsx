import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { LoaderCircle, UserPlus } from "lucide-react";

import { createAccount } from "@/lib/auth/functions";

export function SignupForm() {
  const signup = useServerFn(createAccount);
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const result = await signup({
        data: {
          name: String(formData.get("name") ?? ""),
          email: String(formData.get("email") ?? ""),
          password: String(formData.get("password") ?? ""),
        },
      });

      if (result.requiresEmailConfirmation) {
        form.reset();
        setSuccess("Conta criada. Confira seu e-mail para confirmar o cadastro antes de entrar.");
      } else {
        await navigate({ to: result.redirectTo });
      }
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Não foi possível criar sua conta agora.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-off-white">
          Nome
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          minLength={2}
          maxLength={120}
          required
          className="h-11 w-full rounded-md border border-white/15 bg-navy/65 px-3 text-sm text-white outline-none transition-colors placeholder:text-off-white/35 focus:border-gold focus:ring-2 focus:ring-gold/25"
          placeholder="Seu nome"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="signup-email" className="text-sm font-medium text-off-white">
          E-mail
        </label>
        <input
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-11 w-full rounded-md border border-white/15 bg-navy/65 px-3 text-sm text-white outline-none transition-colors placeholder:text-off-white/35 focus:border-gold focus:ring-2 focus:ring-gold/25"
          placeholder="seu@email.com"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="signup-password" className="text-sm font-medium text-off-white">
          Senha
        </label>
        <input
          id="signup-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          maxLength={128}
          required
          className="h-11 w-full rounded-md border border-white/15 bg-navy/65 px-3 text-sm text-white outline-none transition-colors placeholder:text-off-white/35 focus:border-gold focus:ring-2 focus:ring-gold/25"
          placeholder="Mínimo de 6 caracteres"
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

      {success ? (
        <p
          role="status"
          className="rounded-md border border-teal/40 bg-teal/10 px-3 py-2 text-sm text-white"
        >
          {success}
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
          <UserPlus className="h-4 w-4" aria-hidden />
        )}
        {isSubmitting ? "Criando conta..." : "Criar conta"}
      </button>

      <p className="text-center text-sm text-off-white/65">
        Já possui acesso?{" "}
        <Link to="/entrar" className="font-semibold text-gold hover:text-gold-deep">
          Entrar
        </Link>
      </p>
    </form>
  );
}
