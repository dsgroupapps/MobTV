import { Copy, ExternalLink, MonitorPlay } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdminPlayerPanel } from "@/lib/admin/types";
import { AdminEmptyState, AdminPageHeader } from "./AdminResourceUi";

async function copyText(value: string) {
  await navigator.clipboard.writeText(value);
  toast.success("Link copiado.");
}

export function AdminPlayersPage({ players }: { players: AdminPlayerPanel[] }) {
  return (
    <div className="space-y-7">
      <AdminPageHeader
        eyebrow="Players"
        title="Links dos players"
        description="Links técnicos dos painéis ativos para reprodução de mídias aprovadas."
      />

      {players.length === 0 ? (
        <AdminEmptyState message="Nenhum painel ativo disponível para player." />
      ) : (
        <div className="space-y-4">
          {players.map((panel) => {
            const playerPath = `/player/${panel.id}`;
            const playerUrl =
              typeof window === "undefined" ? playerPath : `${window.location.origin}${playerPath}`;
            return (
              <article
                key={panel.id}
                className="rounded-lg border border-border bg-white p-5 sm:p-6"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-navy">{panel.name}</h2>
                      <Badge variant="outline" className="border-teal/35 bg-teal/10 text-navy">
                        Ativo
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-ink-soft">
                      {panel.region} · {panel.address}
                    </p>
                  </div>
                  <MonitorPlay className="h-5 w-5 text-teal" aria-hidden />
                </div>

                <div className="mt-5 flex flex-col gap-2 rounded-md border border-border bg-off-white p-3 sm:flex-row sm:items-center">
                  <code className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs text-navy">
                    {playerUrl}
                  </code>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    title="Copiar link do player"
                    aria-label={`Copiar link do player ${panel.name}`}
                    onClick={() => void copyText(playerUrl)}
                  >
                    <Copy className="h-4 w-4" aria-hidden />
                  </Button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild>
                    <a href={playerPath} target="_blank" rel="noopener noreferrer">
                      <MonitorPlay className="h-4 w-4" aria-hidden />
                      Visualizar player
                    </a>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      void copyText(
                        `<iframe src="${playerUrl}" width="100%" height="100%" frameborder="0"></iframe>`,
                      )
                    }
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden />
                    Copiar código embed
                  </Button>
                </div>

                <ul className="mt-4 space-y-1 text-xs text-ink-soft">
                  <li>O player consulta novos conteúdos a cada 10 segundos.</li>
                  <li>Exibe somente mídias aprovadas de pedidos pagos.</li>
                  <li>Registra a reprodução concluída como OPP.</li>
                </ul>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
