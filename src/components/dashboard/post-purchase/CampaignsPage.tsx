import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock3, Monitor, Plus, Radio, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AdvertiserCampaignsData, AdvertiserOrder } from "@/lib/advertiser/types";
import { OrderStatusBadge } from "./StatusBadge";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const dateFormatter = new Intl.DateTimeFormat("pt-BR");

function CampaignCard({ order, active = false }: { order: AdvertiserOrder; active?: boolean }) {
  return (
    <article className="rounded-lg border border-border bg-white p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-semibold text-navy">
              Campanha #{order.id.slice(0, 8).toUpperCase()}
            </h3>
            {active ? (
              <Badge className="border-teal/35 bg-teal/12 text-navy shadow-none">Ativa</Badge>
            ) : (
              <OrderStatusBadge status={order.status} />
            )}
          </div>
          <p className="mt-2 text-xs text-ink-soft">
            Criada em {dateFormatter.format(new Date(order.createdAt))}
          </p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-soft">
            <span className="inline-flex items-center gap-1.5">
              <Monitor className="h-4 w-4" aria-hidden />
              {order.itemCount} slots reservados
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="h-4 w-4" aria-hidden />
              Total: {currencyFormatter.format(order.totalAmount)}
            </span>
          </div>
        </div>
        <Link
          to="/dashboard/pedidos/$id"
          params={{ id: order.id }}
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-semibold text-navy transition-colors hover:border-gold hover:text-gold-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          Ver detalhes
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </article>
  );
}

function EmptyCampaigns({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-border bg-white px-6 py-12 text-center">
      <Radio className="mx-auto h-8 w-8 text-ink-soft/45" aria-hidden />
      <p className="mt-3 text-sm font-medium text-navy">{message}</p>
    </div>
  );
}

export function CampaignsPage({ data }: { data: AdvertiserCampaignsData }) {
  const activeOrders = data.orders.filter((order) => order.status === "paid");
  const totalSpent = data.orders.reduce((total, order) => total + order.totalAmount, 0);
  const uniquePanels = new Set(
    data.orders.flatMap((order) => order.items.map((item) => item.panel?.name).filter(Boolean)),
  ).size;

  const metrics = [
    {
      label: "Campanhas ativas",
      value: activeOrders.length.toString(),
      detail: "Em execução agora",
    },
    {
      label: "Total investido",
      value: currencyFormatter.format(totalSpent),
      detail: "Em todas as campanhas",
    },
    {
      label: "Exibições",
      value: data.exhibitions.length.toLocaleString("pt-BR"),
      detail: "Total de reproduções",
    },
    { label: "Painéis únicos", value: uniquePanels.toString(), detail: "Locais diferentes" },
  ];

  return (
    <div className="space-y-7">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-[11px] font-medium uppercase text-gold-deep">/ Campanhas</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-navy sm:text-4xl">
            Minhas campanhas
          </h1>
        </div>
        <Link
          to="/dashboard/campanhas/nova"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-gold px-5 text-sm font-semibold text-navy transition-colors hover:bg-gold-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Criar campanha
        </Link>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => (
          <section key={metric.label} className="rounded-lg border border-border bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-ink-soft">{metric.label}</p>
              {index < 2 ? (
                <TrendingUp className="h-4 w-4 text-gold-deep" aria-hidden />
              ) : (
                <Monitor className="h-4 w-4 text-teal" aria-hidden />
              )}
            </div>
            <p className="mt-2 break-words font-display text-2xl font-bold text-navy">
              {metric.value}
            </p>
            <p className="mt-3 text-xs text-ink-soft">{metric.detail}</p>
          </section>
        ))}
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="h-auto max-w-full flex-wrap justify-start">
          <TabsTrigger value="active">Campanhas ativas</TabsTrigger>
          <TabsTrigger value="all">Todas as campanhas</TabsTrigger>
          <TabsTrigger value="exhibitions">Exibições</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeOrders.length > 0 ? (
            activeOrders.map((order) => <CampaignCard key={order.id} order={order} active />)
          ) : (
            <EmptyCampaigns message="Nenhuma campanha ativa" />
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {data.orders.length > 0 ? (
            data.orders.map((order) => <CampaignCard key={order.id} order={order} />)
          ) : (
            <EmptyCampaigns message="Nenhuma campanha encontrada" />
          )}
        </TabsContent>

        <TabsContent value="exhibitions">
          <section className="overflow-hidden rounded-lg border border-border bg-white">
            <header className="border-b border-border px-5 py-4 sm:px-6">
              <h2 className="text-lg font-semibold text-navy">Histórico de exibições</h2>
              <p className="mt-1 text-xs text-ink-soft">Últimas 100 reproduções</p>
            </header>
            {data.exhibitions.length > 0 ? (
              <div className="divide-y divide-border">
                {data.exhibitions.slice(0, 20).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6"
                  >
                    <div>
                      <p className="text-sm font-medium text-navy">{log.panelName}</p>
                      <p className="mt-1 text-xs text-ink-soft">
                        {new Date(log.playedAt).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 shadow-none">
                      {log.durationSeconds}s
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-12 text-center text-sm text-ink-soft">
                Nenhuma exibição registrada.
              </div>
            )}
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
