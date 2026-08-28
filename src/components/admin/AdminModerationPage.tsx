import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Clock3, LoaderCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

import { AssetPreview } from "@/components/dashboard/post-purchase/AssetPreview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { adminModerationQueryOptions, moderateAdminAsset } from "@/lib/admin/moderation";
import type { AdminModerationData } from "@/lib/admin/types";
import type { AuthUser } from "@/lib/auth/types";
import { AdminEmptyState, AdminPageHeader } from "./AdminResourceUi";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export function AdminModerationPage({
  user,
  initialData,
}: {
  user: AuthUser;
  initialData: AdminModerationData;
}) {
  const { data } = useQuery({ ...adminModerationQueryOptions(user.id), initialData });
  const moderate = useServerFn(moderateAdminAsset);
  const queryClient = useQueryClient();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const mutation = useMutation({
    mutationFn: ({ assetId, action }: { assetId: string; action: "approved" | "rejected" }) =>
      moderate({ data: { assetId, action, reason: action === "rejected" ? reason : undefined } }),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["admin-moderation"] });
      toast.success(variables.action === "approved" ? "Mídia aprovada." : "Mídia rejeitada.");
      setRejectingId(null);
      setReason("");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Não foi possível moderar a mídia."),
  });

  return (
    <div className="space-y-7">
      <AdminPageHeader
        eyebrow="Moderação"
        title="Fila de moderação"
        description={`${data.pendingAssets.length} mídia${data.pendingAssets.length === 1 ? "" : "s"} aguardando análise.`}
      />

      {data.pendingAssets.length === 0 ? (
        <AdminEmptyState message="Nenhuma mídia pendente. Todas as mídias enviadas já foram revisadas." />
      ) : (
        <div className="space-y-5">
          {data.pendingAssets.map((asset) => {
            const isRejecting = rejectingId === asset.id;
            const isMutating = mutation.isPending && mutation.variables?.assetId === asset.id;
            return (
              <article
                key={asset.id}
                className="overflow-hidden rounded-lg border border-border bg-white"
              >
                <header className="flex flex-col justify-between gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-start sm:px-6">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-navy">Mídia #{asset.id.slice(0, 8)}</h2>
                      <Badge variant="outline" className="border-gold/35 bg-gold/10 text-gold-deep">
                        Pendente
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-ink-soft">
                      {asset.advertiserName} · {asset.panelName} · {asset.panelRegion}
                    </p>
                  </div>
                  <p className="flex shrink-0 items-center gap-1.5 text-xs text-ink-soft">
                    <Clock3 className="h-3.5 w-3.5" aria-hidden />
                    {dateFormatter.format(new Date(asset.createdAt))}
                  </p>
                </header>

                <div className="grid gap-5 p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
                  <AssetPreview
                    storagePath={asset.storagePath}
                    type={asset.type}
                    className="aspect-video max-h-[28rem] w-full rounded-md bg-off-white object-contain"
                  />
                  <div className="space-y-5">
                    <dl className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <dt className="text-xs text-ink-soft">Tipo</dt>
                        <dd className="mt-1 break-all font-medium text-navy">{asset.type}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-ink-soft">Dimensões</dt>
                        <dd className="mt-1 font-medium text-navy">
                          {asset.width} × {asset.height}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-ink-soft">Duração</dt>
                        <dd className="mt-1 font-medium text-navy">{asset.durationSeconds}s</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-ink-soft">Item do pedido</dt>
                        <dd className="mt-1 font-mono text-xs text-navy">
                          {asset.orderItemId?.slice(0, 8) ?? "N/A"}
                        </dd>
                      </div>
                    </dl>

                    {isRejecting && (
                      <div className="space-y-2">
                        <label
                          htmlFor={`reason-${asset.id}`}
                          className="text-sm font-medium text-navy"
                        >
                          Motivo da rejeição (opcional)
                        </label>
                        <Textarea
                          id={`reason-${asset.id}`}
                          value={reason}
                          maxLength={1_000}
                          onChange={(event) => setReason(event.target.value)}
                          placeholder="Registre a orientação para o anunciante"
                        />
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        onClick={() => mutation.mutate({ assetId: asset.id, action: "approved" })}
                        disabled={mutation.isPending}
                      >
                        {isMutating ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" aria-hidden />
                        )}
                        Aprovar
                      </Button>
                      {isRejecting ? (
                        <>
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() =>
                              mutation.mutate({ assetId: asset.id, action: "rejected" })
                            }
                            disabled={mutation.isPending}
                          >
                            Confirmar rejeição
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setRejectingId(null);
                              setReason("");
                            }}
                            disabled={mutation.isPending}
                          >
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setRejectingId(asset.id);
                            setReason("");
                          }}
                          disabled={mutation.isPending}
                        >
                          <XCircle className="h-4 w-4" aria-hidden />
                          Rejeitar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <section className="overflow-hidden rounded-lg border border-border bg-white">
        <header className="border-b border-border px-5 py-4 sm:px-6">
          <h2 className="text-lg font-semibold text-navy">Histórico recente</h2>
          <p className="mt-1 text-xs text-ink-soft">Últimas 20 decisões registradas.</p>
        </header>
        {data.recentLogs.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-ink-soft">
            Nenhuma decisão registrada.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {data.recentLogs.map((log) => (
              <div
                key={log.id}
                className="grid gap-2 px-5 py-4 text-sm sm:grid-cols-[1fr_auto] sm:px-6"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-navy">Mídia #{log.assetId.slice(0, 8)}</span>
                    <Badge
                      variant="outline"
                      className={
                        log.action === "approved"
                          ? "border-teal/35 bg-teal/10 text-navy"
                          : "border-red/30 bg-red/8 text-red"
                      }
                    >
                      {log.action === "approved" ? "Aprovada" : "Rejeitada"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-ink-soft">
                    {log.reviewerName}
                    {log.reason ? ` · ${log.reason}` : ""}
                  </p>
                </div>
                <time className="text-xs text-ink-soft" dateTime={log.createdAt}>
                  {dateFormatter.format(new Date(log.createdAt))}
                </time>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
