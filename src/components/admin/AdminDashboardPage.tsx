import { Link } from "@tanstack/react-router";
import { DollarSign, Eye, Megaphone, Monitor, Plus, Users } from "lucide-react";

import type { AdminDashboardData } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function occupancyClass(value: number): string {
  if (value === 0) return "bg-border/60 text-ink-soft";
  if (value < 25) return "bg-cyan-100 text-navy";
  if (value < 50) return "bg-teal/20 text-navy";
  if (value < 75) return "bg-gold/35 text-navy";
  return "bg-red/18 text-red";
}

export function AdminDashboardPage({
  data,
  canManage,
}: {
  data: AdminDashboardData;
  canManage: boolean;
}) {
  const metrics = [
    {
      label: "Painéis ativos",
      value: data.metrics.activePanels.toLocaleString("pt-BR"),
      detail: "Painéis em operação",
      icon: Monitor,
    },
    {
      label: "Receita total",
      value: currencyFormatter.format(data.metrics.totalRevenue),
      detail: "Pedidos pagos",
      icon: DollarSign,
    },
    {
      label: "Campanhas ativas",
      value: data.metrics.activeCampaigns.toLocaleString("pt-BR"),
      detail: `${data.metrics.pendingCampaigns} pendente${data.metrics.pendingCampaigns === 1 ? "" : "s"}`,
      icon: Megaphone,
    },
    {
      label: "Total de inserções",
      value: data.metrics.totalInsertions.toLocaleString("pt-BR"),
      detail: "Todas as inserções criadas",
      icon: Eye,
    },
  ];
  const hasOperationalData =
    data.metrics.activePanels > 0 ||
    data.metrics.activeCampaigns > 0 ||
    data.metrics.totalInsertions > 0;

  return (
    <div className="space-y-7">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-[11px] font-medium uppercase text-gold-deep">
            / Administração
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-navy sm:text-4xl">
            Visão geral
          </h1>
          <p className="mt-2 text-sm text-ink-soft sm:text-base">
            Acompanhe a operação da plataforma MOBTV.
          </p>
        </div>
        {canManage && (
          <Link
            to="/admin/campanhas/nova"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-gold px-5 text-sm font-semibold text-navy transition-colors hover:bg-gold-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Criar campanha
          </Link>
        )}
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <section key={metric.label} className="rounded-lg border border-border bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-ink-soft">{metric.label}</p>
                <Icon
                  className={cn("h-4 w-4", index % 2 === 0 ? "text-teal" : "text-gold-deep")}
                  aria-hidden
                />
              </div>
              <p className="mt-2 break-words font-display text-2xl font-bold text-navy">
                {metric.value}
              </p>
              <p className="mt-3 text-xs text-ink-soft">{metric.detail}</p>
            </section>
          );
        })}
      </div>

      {!hasOperationalData && (
        <section className="rounded-lg border border-border bg-white px-6 py-12 text-center">
          <Monitor className="mx-auto h-9 w-9 text-ink-soft/40" aria-hidden />
          <h2 className="mt-3 text-base font-semibold text-navy">Nenhum dado operacional</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Os indicadores aparecerão quando houver painéis e campanhas.
          </p>
        </section>
      )}

      <section className="overflow-hidden rounded-lg border border-border bg-white">
        <header className="border-b border-border px-5 py-4 sm:px-6">
          <h2 className="text-lg font-semibold text-navy">Mapa de ocupação semanal</h2>
          <p className="mt-1 text-xs text-ink-soft">
            Taxa de preenchimento por painel e dia da semana
          </p>
        </header>
        <div className="overflow-x-auto p-5 sm:p-6">
          {data.occupancy.length > 0 ? (
            <div className="min-w-[52rem] space-y-2">
              <div className="grid grid-cols-[13rem_repeat(7,minmax(4.5rem,1fr))] gap-2 text-xs font-medium text-ink-soft">
                <span>Painel</span>
                {data.weekDays.map((day) => (
                  <span key={day} className="text-center capitalize">
                    {day}
                  </span>
                ))}
              </div>
              {data.occupancy.map((panel) => (
                <div
                  key={panel.panelId}
                  className="grid grid-cols-[13rem_repeat(7,minmax(4.5rem,1fr))] items-center gap-2"
                >
                  <span className="truncate text-sm text-navy" title={panel.panelName}>
                    {panel.panelName}
                  </span>
                  {panel.days.map((day) => (
                    <span
                      key={day.date}
                      title={`${panel.panelName} - ${day.date}: ${day.occupancy.toFixed(0)}% ocupado`}
                      className={cn(
                        "flex h-11 items-center justify-center rounded-md text-xs font-semibold",
                        occupancyClass(day.occupancy),
                      )}
                    >
                      {day.occupancy > 0 ? `${day.occupancy.toFixed(0)}%` : "-"}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-ink-soft">
              Nenhum painel ativo para exibir.
            </p>
          )}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="overflow-hidden rounded-lg border border-border bg-white">
          <header className="border-b border-border px-5 py-4 sm:px-6">
            <h2 className="text-lg font-semibold text-navy">Inserções por painel</h2>
            <p className="mt-1 text-xs text-ink-soft">Dez painéis com mais inserções</p>
          </header>
          {data.panelStats.length > 0 ? (
            <div className="divide-y divide-border">
              {data.panelStats.slice(0, 10).map((entry) => (
                <div
                  key={entry.panelName}
                  className="flex items-center justify-between gap-4 px-5 py-3.5 sm:px-6"
                >
                  <span className="truncate text-sm text-navy">{entry.panelName}</span>
                  <strong className="text-sm text-navy">
                    {entry.count.toLocaleString("pt-BR")}
                  </strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-6 py-10 text-center text-sm text-ink-soft">
              Nenhuma inserção cadastrada.
            </p>
          )}
        </section>

        <section className="rounded-lg border border-border bg-white p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-navy">Resumo operacional</h2>
          <dl className="mt-5 space-y-4">
            <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
              <dt className="flex items-center gap-2 text-sm text-ink-soft">
                <Users className="h-4 w-4" aria-hidden />
                Anunciantes pagos
              </dt>
              <dd className="font-semibold text-navy">{data.metrics.advertisers}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-2 text-sm text-ink-soft">
                <Eye className="h-4 w-4" aria-hidden />
                Exibições
              </dt>
              <dd className="font-semibold text-navy">
                {data.metrics.exhibitions.toLocaleString("pt-BR")}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
