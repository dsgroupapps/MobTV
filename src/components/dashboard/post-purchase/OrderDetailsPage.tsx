import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Film,
  Monitor,
  Upload,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AdvertiserOrderDetail } from "@/lib/advertiser/types";
import { AssetUploader, BulkAssetUploader } from "./AssetUploader";
import { AssetStatusBadge, OrderStatusBadge } from "./StatusBadge";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const dateFormatter = new Intl.DateTimeFormat("pt-BR");

function mediaType(type: string) {
  if (type.startsWith("image")) return "Imagem";
  if (type.startsWith("video")) return "Vídeo";
  return type;
}

export function OrderDetailsPage({ order }: { order: AdvertiserOrderDetail | null }) {
  const [showUploader, setShowUploader] = useState<string | null>(null);
  const [showBulkUploader, setShowBulkUploader] = useState(false);

  if (!order) {
    return (
      <section className="rounded-lg border border-border bg-white px-6 py-14 text-center">
        <XCircle className="mx-auto h-9 w-9 text-red" aria-hidden />
        <h1 className="mt-4 text-lg font-semibold text-navy">Ordem de serviço não encontrada</h1>
        <p className="mt-2 text-sm text-ink-soft">
          O pedido não existe ou não pertence à sua conta.
        </p>
        <Link
          to="/dashboard/pedidos"
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gold-deep hover:text-navy"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Voltar aos pedidos
        </Link>
      </section>
    );
  }

  const itemsWithoutAssets = order.items.filter((item) => item.assets.length === 0);

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <header>
        <Link
          to="/dashboard/pedidos"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gold-deep hover:text-navy"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Meus pedidos
        </Link>
        <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="font-mono text-[11px] font-medium uppercase text-gold-deep">
              / Ordem de serviço
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold text-navy sm:text-4xl">
              Pedido #{order.id.slice(0, 8).toUpperCase()}
            </h1>
            <p className="mt-2 text-sm text-ink-soft">Gerencie suas mídias e acompanhe o status.</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
      </header>

      <section className="rounded-lg border border-border bg-white p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
          <div>
            <h2 className="text-lg font-semibold text-navy">Informações da ordem</h2>
            <p className="mt-1 text-xs text-ink-soft">
              Criada em {dateFormatter.format(new Date(order.createdAt))}
            </p>
          </div>
        </div>

        <dl className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <dt className="text-xs text-ink-soft">Valor total</dt>
            <dd className="mt-1 font-display text-2xl font-bold text-navy">
              {currencyFormatter.format(order.totalAmount)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-soft">Exibições</dt>
            <dd className="mt-1 font-display text-2xl font-bold text-navy">
              {order.exhibitions.total.toLocaleString("pt-BR")}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-soft">Data de pagamento</dt>
            <dd className="mt-1 text-sm font-medium text-navy">
              {order.paidAt ? dateFormatter.format(new Date(order.paidAt)) : "Pendente"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-soft">Itens contratados</dt>
            <dd className="mt-1 text-sm font-medium text-navy">{order.itemCount}</dd>
          </div>
        </dl>

        {order.quote && (
          <dl className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs text-ink-soft">Tipo</dt>
              <dd className="mt-1 text-sm font-medium text-navy">
                {order.quote.type === "campaign" ? "Campanha" : "Espaço"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-soft">Período</dt>
              <dd className="mt-1 text-sm font-medium text-navy">
                {order.quote.dateStart ?? "-"} até {order.quote.dateEnd ?? "-"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-soft">Duração</dt>
              <dd className="mt-1 text-sm font-medium text-navy">
                {order.quote.durationSeconds ? `${order.quote.durationSeconds}s` : "-"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-soft">Inserções planejadas</dt>
              <dd className="mt-1 text-sm font-medium text-navy">
                {order.quote.totalInsertions?.toLocaleString("pt-BR") ?? "-"}
              </dd>
            </div>
          </dl>
        )}
      </section>

      <section className="rounded-lg border border-border bg-white p-5 sm:p-7">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-navy">
              <Monitor className="h-5 w-5 text-gold-deep" aria-hidden />
              Painéis contratados
            </h2>
            <p className="mt-1 text-sm text-ink-soft">Envie suas mídias para cada painel.</p>
          </div>
          {order.items.length > 1 && itemsWithoutAssets.length > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowBulkUploader((current) => !current)}
            >
              <Upload className="h-4 w-4" aria-hidden />
              Upload em lote
            </Button>
          )}
        </header>

        {showBulkUploader && (
          <div className="mt-6">
            <BulkAssetUploader
              orderItems={itemsWithoutAssets.map((item) => ({
                id: item.id,
                panelName: item.panel?.name ?? "Painel desconhecido",
              }))}
              onSuccess={() => setShowBulkUploader(false)}
              onCancel={() => setShowBulkUploader(false)}
            />
          </div>
        )}

        <div className="mt-6 divide-y divide-border border-y border-border">
          {order.items.map((item) => (
            <article key={item.id} className="py-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <h3 className="font-semibold text-navy">
                    {item.panel?.name ?? "Painel desconhecido"}
                  </h3>
                  <p className="mt-1 text-xs text-ink-soft">
                    {item.panel?.region ?? "Região não informada"}
                  </p>
                  <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                      {item.date}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" aria-hidden />
                      {item.startTime.slice(0, 5)} · {item.durationSeconds}s
                    </span>
                    <span>{currencyFormatter.format(item.finalPrice)}</span>
                  </p>
                </div>

                {item.assets.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-teal" aria-hidden />
                    <AssetStatusBadge status={item.assets[0].status} />
                  </div>
                ) : (
                  <Button type="button" size="sm" onClick={() => setShowUploader(item.id)}>
                    <Upload className="h-4 w-4" aria-hidden />
                    Enviar mídia
                  </Button>
                )}
              </div>

              {showUploader === item.id && (
                <AssetUploader
                  orderItemId={item.id}
                  onSuccess={() => setShowUploader(null)}
                  onCancel={() => setShowUploader(null)}
                />
              )}

              {item.assets.map((asset) => (
                <div key={asset.id} className="mt-4 rounded-lg bg-off-white p-4">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <p className="flex items-center gap-2 text-sm text-navy">
                      <Film className="h-4 w-4 text-teal" aria-hidden />
                      <strong>Mídia enviada:</strong> {mediaType(asset.type)} · {asset.width} ×{" "}
                      {asset.height} · {asset.durationSeconds}s
                    </p>
                    <p className="text-xs text-ink-soft">
                      Exibições: {order.exhibitions.byAsset[asset.id] ?? 0}
                    </p>
                  </div>
                </div>
              ))}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
