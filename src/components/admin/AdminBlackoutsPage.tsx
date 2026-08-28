import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Edit, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

import { AdminEmptyState, AdminPageHeader, AdminReadOnlyNotice } from "./AdminResourceUi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  adminBlackoutsQueryOptions,
  deleteAdminBlackout,
  saveAdminBlackout,
} from "@/lib/admin/operations";
import type { AdminOperationalPanel, AdminPanelBlackout } from "@/lib/admin/types";
import type { AuthUser } from "@/lib/auth/types";

function BlackoutForm({
  blackout,
  panels,
  onSaved,
}: {
  blackout: AdminPanelBlackout | null;
  panels: AdminOperationalPanel[];
  onSaved: () => void;
}) {
  const save = useServerFn(saveAdminBlackout);
  const queryClient = useQueryClient();
  const [panelId, setPanelId] = useState(blackout?.panelId ?? "");
  const [date, setDate] = useState(blackout?.date ?? "");
  const [startTime, setStartTime] = useState(blackout?.startTime.slice(0, 5) ?? "");
  const [endTime, setEndTime] = useState(blackout?.endTime.slice(0, 5) ?? "");
  const [reason, setReason] = useState(blackout?.reason ?? "");
  const mutation = useMutation({
    mutationFn: () =>
      save({
        data: {
          id: blackout?.id,
          panelId,
          date,
          startTime,
          endTime,
          reason: reason || null,
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-panel-blackouts"] });
      toast.success(blackout ? "Bloqueio atualizado." : "Bloqueio criado.");
      onSaved();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao salvar."),
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate();
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="blackout-panel">Painel</Label>
        <select
          id="blackout-panel"
          value={panelId}
          onChange={(event) => setPanelId(event.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          required
        >
          <option value="">Selecione um painel</option>
          {panels.map((panel) => (
            <option key={panel.id} value={panel.id}>
              {panel.name}
              {panel.active ? "" : " (inativo)"}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="blackout-date">Data</Label>
        <Input
          id="blackout-date"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="blackout-start">Hora início</Label>
          <Input
            id="blackout-start"
            type="time"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="blackout-end">Hora fim</Label>
          <Input
            id="blackout-end"
            type="time"
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="blackout-reason">Motivo (opcional)</Label>
        <Textarea
          id="blackout-reason"
          value={reason}
          maxLength={500}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Ex.: manutenção preventiva"
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />}
          Salvar
        </Button>
      </div>
    </form>
  );
}

export function AdminBlackoutsPage({
  user,
  initialData,
}: {
  user: AuthUser;
  initialData: { panels: AdminOperationalPanel[]; blackouts: AdminPanelBlackout[] };
}) {
  const canManage = user.roles.includes("admin");
  const { data } = useQuery({ ...adminBlackoutsQueryOptions(user.id), initialData });
  const remove = useServerFn(deleteAdminBlackout);
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBlackout, setEditingBlackout] = useState<AdminPanelBlackout | null>(null);
  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-panel-blackouts"] });
      toast.success("Bloqueio excluído.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao excluir."),
  });

  function openEditor(blackout: AdminPanelBlackout | null) {
    setEditingBlackout(blackout);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-7">
      <AdminPageHeader
        eyebrow="Bloqueios"
        title="Bloqueios e manutenção"
        description="Gerencie períodos de indisponibilidade dos painéis operacionais."
        action={
          canManage ? (
            <Button type="button" onClick={() => openEditor(null)}>
              <Plus className="h-4 w-4" aria-hidden />
              Novo bloqueio
            </Button>
          ) : undefined
        }
      />
      {!canManage && <AdminReadOnlyNotice />}

      {data.blackouts.length === 0 ? (
        <AdminEmptyState message="Nenhum bloqueio cadastrado." />
      ) : (
        <div className="space-y-4">
          {data.blackouts.map((blackout) => (
            <article
              key={blackout.id}
              className="rounded-lg border border-border bg-white p-5 sm:p-6"
            >
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-gold-deep" aria-hidden />
                  <div>
                    <h2 className="text-lg font-semibold text-navy">{blackout.panelName}</h2>
                    <p className="mt-1 text-sm capitalize text-ink-soft">
                      {format(parseISO(blackout.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                {canManage && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      title="Editar bloqueio"
                      onClick={() => openEditor(blackout)}
                    >
                      <Edit className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      title="Excluir bloqueio"
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        if (window.confirm("Tem certeza que deseja excluir este bloqueio?")) {
                          deleteMutation.mutate(blackout.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                )}
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-5">
                <Badge variant="outline">
                  {blackout.startTime.slice(0, 5)} - {blackout.endTime.slice(0, 5)}
                </Badge>
                {blackout.reason && <p className="text-sm text-ink-soft">{blackout.reason}</p>}
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBlackout ? "Editar bloqueio" : "Novo bloqueio"}</DialogTitle>
            <DialogDescription>Período em que o painel ficará indisponível.</DialogDescription>
          </DialogHeader>
          <BlackoutForm
            key={editingBlackout?.id ?? "new"}
            blackout={editingBlackout}
            panels={data.panels}
            onSaved={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
