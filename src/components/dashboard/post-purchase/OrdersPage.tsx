import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, CircleDollarSign, Plus, ShoppingBag } from "lucide-react";

import { OrderStatusBadge } from "./StatusBadge";
import type { AdvertiserOrder } from "@/lib/advertiser/types";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const dateFormatter = new Intl.DateTimeFormat("pt-BR");

export function OrdersPage({ orders }: { orders: AdvertiserOrder[] }) {
  return (
    <div className="space-y-7">
      <header>
        <p className="font-mono text-[11px] font-medium uppercase text-gold-deep">/ Pedidos</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-navy sm:text-4xl">Meus pedidos</h1>
      </header>

      {orders.length > 0 ? (
        <div className="grid gap-4">
          {orders.map((order) => (
            <article key={order.id} className="rounded-lg border border-border bg-white p-5 sm:p-6">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-navy/8 text-navy">
                      <ShoppingBag className="h-4 w-4" aria-hidden />
                    </span>
                    <h2 className="text-lg font-semibold text-navy">
                      Pedido #{order.id.slice(0, 8).toUpperCase()}
                    </h2>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink-soft">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                      {dateFormatter.format(new Date(order.createdAt))}
                    </span>
                    {order.paidAt && (
                      <span>Pago em {dateFormatter.format(new Date(order.paidAt))}</span>
                    )}
                    <span>
                      {order.itemCount} {order.itemCount === 1 ? "item" : "itens"}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
                  <p className="flex items-center gap-1.5 font-display text-2xl font-bold text-navy">
                    <CircleDollarSign className="h-5 w-5 text-gold-deep" aria-hidden />
                    {currencyFormatter.format(order.totalAmount)}
                  </p>
                  <Link
                    to="/dashboard/pedidos/$id"
                    params={{ id: order.id }}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border bg-white px-4 text-sm font-semibold text-navy transition-colors hover:border-gold hover:text-gold-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  >
                    Ver detalhes
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="rounded-lg border border-border bg-white px-6 py-14 text-center">
          <ShoppingBag className="mx-auto h-10 w-10 text-ink-soft/45" aria-hidden />
          <h2 className="mt-4 text-lg font-semibold text-navy">Nenhum pedido ainda</h2>
          <p className="mt-2 text-sm text-ink-soft">Comece criando sua primeira campanha.</p>
          <Link
            to="/dashboard/campanhas/nova"
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-gold px-5 text-sm font-semibold text-navy transition-colors hover:bg-gold-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Criar campanha
          </Link>
        </section>
      )}
    </div>
  );
}
