import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

import { Logo } from "@/components/site/Logo";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthShell({ eyebrow, title, description, children }: AuthShellProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy px-5 py-12 text-off-white">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gold/70 shadow-[0_0_24px_rgba(242,183,5,0.3)]"
      />
      <section className="relative w-full max-w-md rounded-lg border border-white/12 bg-navy-soft/35 p-6 shadow-2xl shadow-black/15 sm:p-8">
        <Link
          to="/"
          aria-label="Voltar para a página inicial"
          className="inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          <Logo variant="light" className="h-9" />
        </Link>

        <div className="mt-8">
          <p className="font-mono text-xs font-medium uppercase text-gold">{eyebrow}</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-white">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-off-white/70">{description}</p>
        </div>

        <div className="mt-7">{children}</div>
      </section>
    </main>
  );
}
