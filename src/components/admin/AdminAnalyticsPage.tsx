import { BarChart3, DollarSign, MonitorPlay, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AdminAnalyticsData } from "@/lib/admin/types";
import { AdminEmptyState, AdminPageHeader } from "./AdminResourceUi";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

const statusLabels = {
  pending: "Pendente",
  paid: "Pago",
  released: "Liberado",
  cancelled: "Cancelado",
};

export function AdminAnalyticsPage({ data }: { data: AdminAnalyticsData }) {
  const metrics = [
    {
      label: "Receita total",
      value: currencyFormatter.format(data.metrics.totalRevenue),
      detail: `${data.metrics.paidOrders} pedido${data.metrics.paidOrders === 1 ? "" : "s"} pago${data.metrics.paidOrders === 1 ? "" : "s"}`,
      icon: DollarSign,
    },
    {
      label: "Exibições confirmadas",
      value: data.metrics.totalExhibitions.toLocaleString("pt-BR"),
      detail: "OPPs com status de sucesso",
      icon: MonitorPlay,
    },
    {
      label: "Anunciantes",
      value: data.metrics.uniqueAdvertisers.toLocaleString("pt-BR"),
      detail: "Usuários com pedidos",
      icon: Users,
    },
    {
      label: "Campanhas pagas",
      value: data.metrics.paidOrders.toLocaleString("pt-BR"),
      detail: "Pedidos pagos cadastrados",
      icon: BarChart3,
    },
  ];

  return (
    <div className="space-y-7">
      <AdminPageHeader
        eyebrow="Analytics"
        title="Analytics e métricas"
        description="Indicadores observados nos pedidos e registros reais de reprodução da plataforma."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <section key={metric.label} className="rounded-lg border border-border bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-ink-soft">{metric.label}</p>
                <Icon className="h-4 w-4 text-teal" aria-hidden />
              </div>
              <p className="mt-2 break-words font-display text-2xl font-bold text-navy">
                {metric.value}
              </p>
              <p className="mt-3 text-xs text-ink-soft">{metric.detail}</p>
            </section>
          );
        })}
      </div>

      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList className="h-auto flex-wrap justify-start">
          <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
          <TabsTrigger value="clients">Exibições por cliente</TabsTrigger>
          <TabsTrigger value="plays">OPPs recentes</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          <section className="overflow-hidden rounded-lg border border-border bg-white">
            <TableHeader title="Todas as campanhas" detail="Histórico de pedidos cadastrados" />
            {data.orders.length === 0 ? (
              <AdminEmptyState message="Nenhum pedido cadastrado para analisar." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[48rem] text-left text-sm">
                  <thead className="border-b border-border bg-off-white text-xs text-ink-soft">
                    <tr>
                      <th className="px-5 py-3 font-medium">Cliente</th>
                      <th className="px-5 py-3 font-medium">Data</th>
                      <th className="px-5 py-3 font-medium">Inserções</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 text-right font-medium">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.orders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-5 py-3.5 font-medium text-navy">{order.userName}</td>
                        <td className="px-5 py-3.5 text-ink-soft">
                          {dateFormatter.format(new Date(order.createdAt))}
                        </td>
                        <td className="px-5 py-3.5 text-navy">{order.itemCount}</td>
                        <td className="px-5 py-3.5">
                          <Badge variant="outline">{statusLabels[order.status]}</Badge>
                        </td>
                        <td className="px-5 py-3.5 text-right font-medium text-navy">
                          {currencyFormatter.format(order.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </TabsContent>

        <TabsContent value="clients">
          <section className="overflow-hidden rounded-lg border border-border bg-white">
            <TableHeader
              title="Exibições por cliente"
              detail={`Agregação da janela dos ${data.recentLogLimit} OPPs mais recentes`}
            />
            {data.clients.length === 0 ? (
              <AdminEmptyState message="Nenhuma reprodução registrada para agrupar." />
            ) : (
              <div className="divide-y divide-border">
                {data.clients.map((client) => (
                  <div
                    key={client.userId}
                    className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_10rem_10rem] sm:items-center sm:px-6"
                  >
                    <span className="font-medium text-navy">{client.userName}</span>
                    <span className="text-sm text-ink-soft">
                      {client.exhibitions.toLocaleString("pt-BR")} exibições
                    </span>
                    <span className="text-sm text-ink-soft">
                      {client.panelCount.toLocaleString("pt-BR")} painéis
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </TabsContent>

        <TabsContent value="plays">
          <section className="overflow-hidden rounded-lg border border-border bg-white">
            <TableHeader
              title="OPPs recentes"
              detail={`Até ${data.recentLogLimit} registros, do mais recente para o mais antigo`}
            />
            {data.recentOppLogs.length === 0 ? (
              <AdminEmptyState message="Nenhum OPP registrado." />
            ) : (
              <div className="divide-y divide-border">
                {data.recentOppLogs.map((log) => (
                  <div
                    key={log.id}
                    className="grid gap-2 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-navy">{log.panelName}</span>
                        <Badge
                          variant="outline"
                          className={
                            log.status === "success"
                              ? "border-teal/35 bg-teal/10 text-navy"
                              : "border-red/30 bg-red/8 text-red"
                          }
                        >
                          {log.status === "success" ? "Sucesso" : "Falha"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-ink-soft">
                        {log.advertiserName} · {log.panelRegion} · {log.durationSeconds}s
                      </p>
                    </div>
                    <time className="text-xs text-ink-soft" dateTime={log.playedAt}>
                      {dateFormatter.format(new Date(log.playedAt))}
                    </time>
                  </div>
                ))}
              </div>
            )}
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TableHeader({ title, detail }: { title: string; detail: string }) {
  return (
    <header className="border-b border-border px-5 py-4 sm:px-6">
      <h2 className="text-lg font-semibold text-navy">{title}</h2>
      <p className="mt-1 text-xs text-ink-soft">{detail}</p>
    </header>
  );
}
