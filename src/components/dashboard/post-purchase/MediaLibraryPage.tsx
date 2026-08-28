import { Link } from "@tanstack/react-router";
import { Clock3, Film, Plus } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

import type { AdvertiserAsset } from "@/lib/advertiser/types";
import { AssetPreview } from "./AssetPreview";
import { AssetStatusBadge } from "./StatusBadge";

export function MediaLibraryPage({ assets }: { assets: AdvertiserAsset[] }) {
  return (
    <div className="space-y-7">
      <header>
        <p className="font-mono text-[11px] font-medium uppercase text-gold-deep">/ Mídias</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-navy sm:text-4xl">
          Minha biblioteca de mídias
        </h1>
        <p className="mt-2 text-sm text-ink-soft sm:text-base">
          Gerencie todas as suas mídias. Os arquivos são excluídos automaticamente após 7 dias.
        </p>
      </header>

      {assets.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {assets.map((asset) => (
            <article
              key={asset.id}
              className="overflow-hidden rounded-lg border border-border bg-white"
            >
              <div className="aspect-video bg-off-white">
                <AssetPreview
                  storagePath={asset.storagePath}
                  type={asset.type}
                  className="h-full w-full"
                />
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-navy">
                      {asset.width} × {asset.height}
                    </h2>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-soft">
                      <Clock3 className="h-3.5 w-3.5" aria-hidden />
                      {asset.durationSeconds}s
                    </p>
                  </div>
                  <AssetStatusBadge status={asset.status} />
                </div>

                {asset.panel && (
                  <p className="mt-4 text-sm text-ink-soft">
                    <span className="font-medium text-navy">Painel:</span> {asset.panel.name}
                  </p>
                )}

                <div className="mt-4 space-y-1 border-t border-border pt-4 text-xs text-ink-soft">
                  <p>
                    Criada{" "}
                    {formatDistanceToNow(new Date(asset.createdAt), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                  {asset.deleteAt && (
                    <p className="font-medium text-gold-deep">
                      Será excluída em{" "}
                      {format(new Date(asset.deleteAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="rounded-lg border border-border bg-white px-6 py-14 text-center">
          <Film className="mx-auto h-10 w-10 text-ink-soft/45" aria-hidden />
          <h2 className="mt-4 text-lg font-semibold text-navy">Nenhuma mídia encontrada</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-soft">
            Você ainda não enviou nenhuma mídia. Crie uma campanha e envie os arquivos pelo pedido.
          </p>
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
