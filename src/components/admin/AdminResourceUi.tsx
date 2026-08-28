import type { ReactNode } from "react";
import { Eye, Inbox } from "lucide-react";

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        <p className="font-mono text-[11px] font-medium uppercase text-gold-deep">/ {eyebrow}</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-navy sm:text-4xl">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-soft sm:text-base">{description}</p>
      </div>
      {action}
    </header>
  );
}

export function AdminEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-white px-6 py-14 text-center">
      <Inbox className="mx-auto h-8 w-8 text-ink-soft/65" aria-hidden />
      <p className="mt-3 text-sm text-ink-soft">{message}</p>
    </div>
  );
}

export function AdminReadOnlyNotice() {
  return (
    <div className="flex items-start gap-3 rounded-md border border-teal/25 bg-teal/8 px-4 py-3 text-sm text-navy">
      <Eye className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden />
      <p>Seu perfil possui acesso operacional em modo leitura.</p>
    </div>
  );
}

export const adminFieldClass =
  "flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:cursor-not-allowed disabled:opacity-60";
