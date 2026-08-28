import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  Film,
  Megaphone,
  Plus,
  ShoppingBag,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type {
  AdvertiserDashboardData,
  DashboardAsset,
  DashboardOrder,
} from "@/lib/dashboard/advertiser-dashboard";
import { cn } from "@/lib/utils";

type AdvertiserDashboardProps = {
  userName: string;
  data: AdvertiserDashboardData;
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function orderStatus(status: DashboardOrder["status"]) {
  const statuses = {
    pending: { label: "Pendente", className: "border-gold/35 bg-gold/12 text-gold-deep" },
    paid: { label: "Pago", className: "border-teal/35 bg-teal/12 text-navy" },
    released: { label: "Liberado", className: "border-teal/35 bg-teal/12 text-navy" },
    cancelled: { label: "Cancelado", className: "border-red/30 bg-red/8 text-red" },
  } as const;
  return statuses[status];
}

function assetStatus(status: DashboardAsset["status"]) {
  const statuses = {
    pending: { label: "Em análise", className: "border-gold/35 bg-gold/12 text-gold-deep" },
    approved: { label: "Aprovada", className: "border-teal/35 bg-teal/12 text-navy" },
    rejected: { label: "Rejeitada", className: "border-red/30 bg-red/8 text-red" },
  } as const;
  return statuses[status];
}

function mediaType(type: string): string {
  if (type.toLowerCase().includes("video")) return "Vídeo";
  if (type.toLowerCase().includes("image")) return "Imagem";
  return type;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  to,
  accent = "navy",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  detail: string;
  to: "/dashboard/pedidos" | "/dashboard/campanhas" | "/dashboard/midias";
  accent?: "navy" | "gold" | "teal";
}) {
  return (
    <Link
      to={to}
      className="rounded-lg border border-border bg-white p-5 transition-colors hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-ink-soft">{label}</p>
          <p className="mt-2 break-words font-display text-3xl font-bold text-navy">{value}</p>
        </div>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-md",
            accent === "navy" && "bg-navy/8 text-navy",
            accent === "gold" && "bg-gold/15 text-gold-deep",
            accent === "teal" && "bg-teal/15 text-navy",
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      </div>
      <p className="mt-4 text-xs text-ink-soft">{detail}</p>
    </Link>
  );
}

function StatusBadge({ label, className }: { label: string; className: string }) {
  return (
    <Badge variant="outline" className={cn("shrink-0 font-medium shadow-none", className)}>
      {label}
    </Badge>
  );
}

export function AdvertiserDashboard({ userName, data }: AdvertiserDashboardProps) {
  const firstName = userName.trim().split(/\s+/)[0] || userName;
  const { metrics, recentOrders, recentAssets } = data;

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-[11px] font-medium uppercase text-gold-deep">
            / Visão geral
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-navy sm:text-4xl">
            Olá, {firstName}
          </h1>
          <p className="mt-2 text-sm text-ink-soft sm:text-base">
            Acompanhe seus pedidos, mídias e resultados em um só lugar.
          </p>
        </div>
        <Link
          to="/dashboard/campanhas/nova"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-gold px-5 text-sm font-semibold text-navy transition-colors hover:bg-gold-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Criar campanha
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={ShoppingBag}
          label="Pedidos"
          value={metrics.totalOrders}
          detail={`${metrics.pendingOrders} pendente${metrics.pendingOrders === 1 ? "" : "s"}`}
          to="/dashboard/pedidos"
        />
        <MetricCard
          icon={WalletCards}
          label="Investimento confirmado"
          value={currencyFormatter.format(metrics.totalInvestment)}
          detail={`${metrics.confirmedOrders} pedido${metrics.confirmedOrders === 1 ? "" : "s"} confirmado${metrics.confirmedOrders === 1 ? "" : "s"}`}
          to="/dashboard/campanhas"
          accent="gold"
        />
        <MetricCard
          icon={Film}
          label="Mídias"
          value={metrics.totalAssets}
          detail={`${metrics.approvedAssets} aprovada${metrics.approvedAssets === 1 ? "" : "s"} · ${metrics.pendingAssets} em análise`}
          to="/dashboard/midias"
          accent="teal"
        />
        <MetricCard
          icon={BarChart3}
          label="Exibições comprovadas"
          value={metrics.totalExhibitions.toLocaleString("pt-BR")}
          detail="Registros de veiculação concluídos"
          to="/dashboard/campanhas"
          accent="teal"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="overflow-hidden rounded-lg border border-border bg-white">
          <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-navy">
                <Clock3 className="h-5 w-5 text-gold-deep" aria-hidden />
                Pedidos recentes
              </h2>
              <p className="mt-1 text-xs text-ink-soft">Últimas campanhas contratadas</p>
            </div>
            <Link
              to="/dashboard/pedidos"
              className="inline-flex items-center gap-1 text-xs font-semibold text-gold-deep hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              Ver pedidos
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </header>

          {recentOrders.length > 0 ? (
            <div className="divide-y divide-border">
              {recentOrders.map((order) => {
                const status = orderStatus(order.status);
                return (
                  <Link
                    key={order.id}
                    to="/dashboard/pedidos/$id"
                    params={{ id: order.id }}
                    className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-navy/7 text-navy">
                        <Megaphone className="h-4 w-4" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-navy">
                          Pedido #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-soft">
                          {dateFormatter.format(new Date(order.createdAt))}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <p className="text-sm font-semibold text-navy">
                        {currencyFormatter.format(order.totalAmount)}
                      </p>
                      <StatusBadge {...status} />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <ShoppingBag className="mx-auto h-8 w-8 text-ink-soft/45" aria-hidden />
              <p className="mt-3 text-sm font-medium text-navy">Nenhum pedido ainda</p>
              <Link
                to="/dashboard/campanhas/nova"
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-gold-deep hover:text-navy"
              >
                Criar primeira campanha
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-lg border border-border bg-white">
          <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-navy">
                <CheckCircle2 className="h-5 w-5 text-teal" aria-hidden />
                Status das mídias
              </h2>
              <p className="mt-1 text-xs text-ink-soft">Aprovação e moderação dos arquivos</p>
            </div>
            <Link
              to="/dashboard/midias"
              className="inline-flex items-center gap-1 text-xs font-semibold text-gold-deep hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              Ver mídias
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </header>

          {recentAssets.length > 0 ? (
            <div className="divide-y divide-border">
              {recentAssets.map((asset) => {
                const status = assetStatus(asset.status);
                return (
                  <Link
                    key={asset.id}
                    to="/dashboard/midias"
                    className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-teal/12 text-navy">
                        <Film className="h-4 w-4" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold capitalize text-navy">
                          {mediaType(asset.type)}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-soft">
                          {asset.width} × {asset.height} ·{" "}
                          {dateFormatter.format(new Date(asset.createdAt))}
                        </p>
                      </div>
                    </div>
                    <StatusBadge {...status} />
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <Film className="mx-auto h-8 w-8 text-ink-soft/45" aria-hidden />
              <p className="mt-3 text-sm font-medium text-navy">Nenhuma mídia enviada</p>
              <p className="mt-1 text-xs text-ink-soft">
                Seus arquivos aparecerão aqui após o envio.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
