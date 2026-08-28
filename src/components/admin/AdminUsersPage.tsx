import { Link } from "@tanstack/react-router";
import { CalendarDays, CheckCircle2, Image, TrendingUp, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { AdminUsersData } from "@/lib/admin/types";

const dateFormatter = new Intl.DateTimeFormat("pt-BR");

const roleLabels = {
  admin: "Administrador",
  operator: "Operador",
  advertiser: "Anunciante",
} as const;

export function AdminUsersPage({ data }: { data: AdminUsersData }) {
  const metrics = [
    { label: "Total de usuários", value: data.stats.totalUsers, icon: Users },
    { label: "Campanhas (30 dias)", value: data.stats.recentCampaigns, icon: TrendingUp },
    { label: "Mídias pendentes", value: data.stats.pendingAssets, icon: Image },
    { label: "Mídias aprovadas", value: data.stats.approvedAssets, icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-7">
      <header>
        <p className="font-mono text-[11px] font-medium uppercase text-gold-deep">/ Usuários</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-navy sm:text-4xl">
          Gerenciamento de usuários
        </h1>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <section key={metric.label} className="rounded-lg border border-border bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-ink-soft">{metric.label}</p>
                <Icon className="h-4 w-4 text-gold-deep" aria-hidden />
              </div>
              <p className="mt-2 font-display text-2xl font-bold text-navy">
                {metric.value.toLocaleString("pt-BR")}
              </p>
            </section>
          );
        })}
      </div>

      <section className="overflow-hidden rounded-lg border border-border bg-white">
        <header className="border-b border-border px-5 py-4 sm:px-6">
          <h2 className="text-lg font-semibold text-navy">Todos os usuários</h2>
        </header>
        {data.users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[62rem] text-left text-sm">
              <thead className="bg-off-white text-xs text-ink-soft">
                <tr>
                  <th className="px-5 py-3 font-medium sm:px-6">Nome</th>
                  <th className="px-5 py-3 font-medium">Tipo</th>
                  <th className="px-5 py-3 font-medium">Mídias</th>
                  <th className="px-5 py-3 font-medium">Campanhas recentes</th>
                  <th className="px-5 py-3 font-medium">Cadastrado em</th>
                  <th className="px-5 py-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-5 py-4 font-medium text-navy sm:px-6">{user.name}</td>
                    <td className="px-5 py-4">
                      <Badge
                        variant={user.role === "admin" ? "default" : "secondary"}
                        className="shadow-none"
                      >
                        {roleLabels[user.role]}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="shadow-none">
                          {user.approvedAssets} aprovadas
                        </Badge>
                        {user.pendingAssets > 0 && (
                          <Badge variant="secondary" className="shadow-none">
                            {user.pendingAssets} pendentes
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {user.recentOrders.length > 0 ? (
                        <div className="space-y-1.5">
                          {user.recentOrders.map((order) => (
                            <div key={order.id} className="flex items-center gap-2">
                              <Badge
                                variant={order.status === "paid" ? "default" : "secondary"}
                                className="shadow-none"
                              >
                                {order.status}
                              </Badge>
                              <span className="text-xs text-ink-soft">
                                {dateFormatter.format(new Date(order.createdAt))}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-ink-soft">Sem campanhas</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-ink-soft">
                      {dateFormatter.format(new Date(user.createdAt))}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        to="/admin/campanhas"
                        search={{ user: user.id }}
                        className="inline-flex min-h-9 items-center gap-2 rounded-md border border-border px-3 text-xs font-semibold text-navy transition-colors hover:border-gold hover:text-gold-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                      >
                        <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                        Gerenciar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-14 text-center">
            <Users className="mx-auto h-9 w-9 text-ink-soft/40" aria-hidden />
            <p className="mt-3 text-sm text-ink-soft">Nenhum usuário encontrado.</p>
          </div>
        )}
      </section>
    </div>
  );
}
