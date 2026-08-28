import { Link } from "@tanstack/react-router";
import { ArrowLeft, type LucideIcon } from "lucide-react";

type DashboardPlaceholderProps = {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
};

export function DashboardPlaceholder({
  icon: Icon,
  eyebrow,
  title,
  description,
}: DashboardPlaceholderProps) {
  return (
    <div className="max-w-3xl">
      <p className="font-mono text-[11px] font-medium uppercase text-gold-deep">/ {eyebrow}</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-navy sm:text-4xl">{title}</h1>

      <section className="mt-8 rounded-lg border border-border bg-white p-7 sm:p-9">
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-navy/8 text-navy">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <p className="mt-5 max-w-xl text-sm leading-6 text-ink-soft">{description}</p>
        <Link
          to="/dashboard"
          className="mt-7 inline-flex min-h-10 items-center gap-2 rounded-md border border-border px-4 text-sm font-semibold text-navy transition-colors hover:border-gold hover:text-gold-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Voltar à visão geral
        </Link>
      </section>
    </div>
  );
}
