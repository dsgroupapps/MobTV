import { useState, type DragEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, ChevronRight, LoaderCircle, Move, Plus, User } from "lucide-react";
import { addDays, addMinutes, format, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminReservationsQueryOptions, adminRescheduleOrderItem } from "@/lib/admin/campaigns";
import type { AdminCampaignFilters, AdminReservation } from "@/lib/admin/types";
import type { AuthUser } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

function generateSlots(date: Date): Date[] {
  return Array.from({ length: 48 }, (_, index) => addMinutes(startOfDay(date), index * 30));
}

function reservationsAtSlot(slot: Date, reservations: AdminReservation[]): AdminReservation[] {
  const slotSeconds = slot.getHours() * 3_600 + slot.getMinutes() * 60;
  return reservations.filter((reservation) => {
    const [hour, minute, second] = reservation.startTime.split(":").map(Number);
    const startSeconds = hour * 3_600 + minute * 60 + second;
    return slotSeconds >= startSeconds && slotSeconds < startSeconds + reservation.durationSeconds;
  });
}

export function AdminCampaignsPage({
  user,
  filters,
  initialUserId,
}: {
  user: AuthUser;
  filters: AdminCampaignFilters;
  initialUserId?: string;
}) {
  const canManage = user.roles.includes("admin");
  const queryClient = useQueryClient();
  const reschedule = useServerFn(adminRescheduleOrderItem);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedPanel, setSelectedPanel] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(initialUserId ?? null);
  const [editingReservation, setEditingReservation] = useState<AdminReservation | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newStartTime, setNewStartTime] = useState("");
  const dateKey = format(selectedDate, "yyyy-MM-dd");
  const {
    data: reservations = [],
    isLoading,
    error,
  } = useQuery(adminReservationsQueryOptions(user.id, dateKey, selectedPanel, selectedUser));

  const updateMutation = useMutation({
    mutationFn: ({
      orderItemId,
      date,
      startTime,
    }: {
      orderItemId: string;
      date: string;
      startTime: string;
    }) => {
      if (!date || !startTime) throw new Error("Informe a nova data e o novo horário.");
      return reschedule({
        data: { orderItemId, date, startTime },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-reservations", user.id] });
      await queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      toast.success("Reserva atualizada com sucesso.");
      setEditingReservation(null);
    },
    onError: (mutationError) => {
      toast.error(
        `Erro ao atualizar: ${mutationError instanceof Error ? mutationError.message : "tente novamente"}`,
      );
    },
  });

  function openEditor(reservation: AdminReservation) {
    if (!canManage) return;
    setEditingReservation(reservation);
    setNewDate(reservation.date);
    setNewStartTime(reservation.startTime);
  }

  function moveReservation(reservationId: string, slot: Date) {
    if (!canManage) return;
    if (!reservations.some((entry) => entry.id === reservationId)) return;
    updateMutation.mutate({
      orderItemId: reservationId,
      date: format(selectedDate, "yyyy-MM-dd"),
      startTime: format(slot, "HH:mm:ss"),
    });
  }

  function handleDrop(event: DragEvent, slot: Date) {
    event.preventDefault();
    moveReservation(event.dataTransfer.getData("reservationId"), slot);
  }

  return (
    <div className="space-y-7">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-[11px] font-medium uppercase text-gold-deep">/ Campanhas</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-navy sm:text-4xl">
            Gerenciamento de campanhas
          </h1>
          <p className="mt-2 text-sm text-ink-soft sm:text-base">
            Visualize reservas por usuário, painel e horário.
          </p>
        </div>
        {canManage && (
          <Link
            to="/admin/campanhas/nova"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-gold px-5 text-sm font-semibold text-navy transition-colors hover:bg-gold-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Criar campanha
          </Link>
        )}
      </header>

      <div className="grid gap-5 xl:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="self-start rounded-lg border border-border bg-white p-5">
          <h2 className="text-sm font-semibold text-navy">Filtros</h2>
          <div className="mt-5 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="admin-campaign-user">Usuário</Label>
              <select
                id="admin-campaign-user"
                value={selectedUser ?? "all"}
                onChange={(event) =>
                  setSelectedUser(event.target.value === "all" ? null : event.target.value)
                }
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <option value="all">Todos os usuários</option>
                {filters.users.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-campaign-panel">Painel</Label>
              <select
                id="admin-campaign-panel"
                value={selectedPanel ?? "all"}
                onChange={(event) =>
                  setSelectedPanel(event.target.value === "all" ? null : event.target.value)
                }
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <option value="all">Todos os painéis</option>
                {filters.panels.map((panel) => (
                  <option key={panel.id} value={panel.id}>
                    {panel.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="mb-2 block">Data</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border border-border"
              />
            </div>
          </div>
        </aside>

        <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-white">
          <header className="flex flex-col justify-between gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:px-6">
            <div>
              <h2 className="text-lg font-semibold capitalize text-navy">
                {format(selectedDate, "PPPP", { locale: ptBR })}
              </h2>
              <p className="mt-1 text-xs text-ink-soft">
                {canManage
                  ? "Arraste ou clique para remanejar horários"
                  : "Consulta operacional em modo leitura"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Dia anterior"
                onClick={() => setSelectedDate((current) => addDays(current, -1))}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </Button>
              <Button type="button" variant="outline" onClick={() => setSelectedDate(new Date())}>
                Hoje
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Próximo dia"
                onClick={() => setSelectedDate((current) => addDays(current, 1))}
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </header>

          <div className="overflow-x-auto p-4 sm:p-5">
            {isLoading ? (
              <div className="flex min-h-64 items-center justify-center text-sm text-ink-soft">
                <LoaderCircle className="mr-2 h-5 w-5 animate-spin" aria-hidden />
                Carregando reservas...
              </div>
            ) : error ? (
              <div className="min-h-64 py-12 text-center text-sm text-red" role="alert">
                {error.message}
              </div>
            ) : (
              <div className="grid min-w-[42rem] grid-cols-4 gap-2">
                {generateSlots(selectedDate).map((slot) => {
                  const entries = reservationsAtSlot(slot, reservations);
                  return (
                    <div
                      key={slot.toISOString()}
                      onDrop={(event) => handleDrop(event, slot)}
                      onDragOver={(event) => canManage && event.preventDefault()}
                      className={cn(
                        "min-h-28 rounded-md border p-2 text-xs",
                        entries.length > 0
                          ? "border-gold/50 bg-gold/8"
                          : "border-border bg-off-white",
                      )}
                    >
                      <p className="mb-2 font-semibold text-navy">{format(slot, "HH:mm")}</p>
                      {entries.map((reservation) => (
                        <button
                          type="button"
                          key={reservation.id}
                          draggable={canManage}
                          onDragStart={(event) =>
                            event.dataTransfer.setData("reservationId", reservation.id)
                          }
                          onClick={() => openEditor(reservation)}
                          className={cn(
                            "mb-2 block w-full rounded-md border border-border bg-white p-2 text-left",
                            canManage &&
                              "cursor-move transition-colors hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                          )}
                        >
                          <span className="flex items-center gap-1 font-medium text-navy">
                            <Move className="h-3 w-3 shrink-0 text-gold-deep" aria-hidden />
                            <span className="truncate">{reservation.panelName}</span>
                          </span>
                          <span className="mt-1 flex items-center gap-1 text-ink-soft">
                            <User className="h-3 w-3 shrink-0" aria-hidden />
                            <span className="truncate">{reservation.userName}</span>
                          </span>
                          <Badge variant="secondary" className="mt-2 text-[10px] shadow-none">
                            {reservation.durationSeconds}s
                          </Badge>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
            {!isLoading && !error && reservations.length === 0 && (
              <p className="py-8 text-center text-sm text-ink-soft">
                Nenhuma reserva para esta data.
              </p>
            )}
          </div>
        </section>
      </div>

      <Dialog
        open={Boolean(editingReservation)}
        onOpenChange={(open) => !open && !updateMutation.isPending && setEditingReservation(null)}
      >
        <DialogContent className="border-border bg-white">
          <DialogHeader>
            <DialogTitle className="text-navy">Editar reserva</DialogTitle>
            <DialogDescription>Altere a data e o horário da reserva de mídia.</DialogDescription>
          </DialogHeader>
          {editingReservation && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-navy">Painel</p>
                <p className="mt-1 text-sm text-ink-soft">{editingReservation.panelName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-navy">Usuário</p>
                <p className="mt-1 text-sm text-ink-soft">{editingReservation.userName}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-new-date">Nova data</Label>
                <Input
                  id="admin-new-date"
                  type="date"
                  value={newDate}
                  onChange={(event) => setNewDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-new-time">Novo horário</Label>
                <Input
                  id="admin-new-time"
                  type="time"
                  step="300"
                  value={newStartTime.slice(0, 5)}
                  onChange={(event) => setNewStartTime(`${event.target.value}:00`)}
                />
              </div>
              <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingReservation(null)}
                  disabled={updateMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={() =>
                    updateMutation.mutate({
                      orderItemId: editingReservation.id,
                      date: newDate,
                      startTime: newStartTime,
                    })
                  }
                  disabled={!newDate || !newStartTime || updateMutation.isPending}
                >
                  {updateMutation.isPending && (
                    <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
                  )}
                  {updateMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
