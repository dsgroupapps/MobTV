import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { addDays, addMinutes, format, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, LoaderCircle, Move, User } from "lucide-react";
import { toast } from "sonner";

import { AdminPageHeader, AdminReadOnlyNotice } from "./AdminResourceUi";
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
import type { AdminOperationalPanel, AdminReservation } from "@/lib/admin/types";
import type { AuthUser } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

type ViewMode = "day" | "hour";

function generateSlots(date: Date, viewMode: ViewMode): Date[] {
  const start = startOfDay(date);
  const count = viewMode === "day" ? 24 : 24 * 12;
  const interval = viewMode === "day" ? 60 : 5;
  return Array.from({ length: count }, (_, index) => addMinutes(start, index * interval));
}

function reservationsAtSlot(slot: Date, reservations: AdminReservation[]): AdminReservation[] {
  const slotSeconds = slot.getHours() * 3_600 + slot.getMinutes() * 60;
  return reservations.filter((reservation) => {
    const [hour, minute, second] = reservation.startTime.split(":").map(Number);
    const startSeconds = hour * 3_600 + minute * 60 + second;
    return slotSeconds >= startSeconds && slotSeconds < startSeconds + reservation.durationSeconds;
  });
}

export function AdminInventoryCalendarPage({
  user,
  panels,
}: {
  user: AuthUser;
  panels: AdminOperationalPanel[];
}) {
  const canManage = user.roles.includes("admin");
  const reschedule = useServerFn(adminRescheduleOrderItem);
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedPanel, setSelectedPanel] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [editingReservation, setEditingReservation] = useState<AdminReservation | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newStartTime, setNewStartTime] = useState("");
  const dateKey = format(selectedDate, "yyyy-MM-dd");
  const {
    data: reservations = [],
    isLoading,
    error,
  } = useQuery(adminReservationsQueryOptions(user.id, dateKey, selectedPanel, null));
  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editingReservation || !newDate || !newStartTime) {
        throw new Error("Informe a nova data e o novo horário.");
      }
      return reschedule({
        data: {
          orderItemId: editingReservation.id,
          date: newDate,
          startTime: `${newStartTime.slice(0, 5)}:00`,
        },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-reservations", user.id] });
      await queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      toast.success("Slot remanejado com sucesso.");
      setEditingReservation(null);
    },
    onError: (mutationError) =>
      toast.error(mutationError instanceof Error ? mutationError.message : "Erro ao remanejar."),
  });
  const slots = generateSlots(selectedDate, viewMode);

  function openEditor(reservation: AdminReservation) {
    if (!canManage) return;
    setEditingReservation(reservation);
    setNewDate(reservation.date);
    setNewStartTime(reservation.startTime.slice(0, 5));
  }

  return (
    <div className="space-y-7">
      <AdminPageHeader
        eyebrow="Inventário"
        title="Calendário de inventário"
        description="Visualize os slots ocupados por data, hora e painel."
      />
      {!canManage && <AdminReadOnlyNotice />}

      <div className="grid gap-5 xl:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="self-start rounded-lg border border-border bg-white p-5">
          <h2 className="text-sm font-semibold text-navy">Filtros</h2>
          <div className="mt-5 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="inventory-panel">Painel</Label>
              <select
                id="inventory-panel"
                value={selectedPanel ?? "all"}
                onChange={(event) =>
                  setSelectedPanel(event.target.value === "all" ? null : event.target.value)
                }
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <option value="all">Todos os painéis</option>
                {panels.map((panel) => (
                  <option key={panel.id} value={panel.id}>
                    {panel.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inventory-view">Visualização</Label>
              <select
                id="inventory-view"
                value={viewMode}
                onChange={(event) => setViewMode(event.target.value as ViewMode)}
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <option value="day">Por hora</option>
                <option value="hour">A cada 5 minutos</option>
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
                {canManage ? "Clique em uma reserva para remanejar" : "Consulta em modo leitura"}
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

          <div className="max-h-[70vh] overflow-auto p-4 sm:p-5">
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
              <div
                className={cn(
                  "grid min-w-[42rem] gap-2",
                  viewMode === "day" ? "grid-cols-6" : "grid-cols-12",
                )}
              >
                {slots.map((slot) => {
                  const entries = reservationsAtSlot(slot, reservations);
                  return (
                    <div
                      key={slot.toISOString()}
                      className={cn(
                        "min-h-20 rounded-md border p-2 text-xs",
                        entries.length > 0
                          ? "border-gold/50 bg-gold/8"
                          : "border-border bg-off-white",
                      )}
                    >
                      <p className="mb-2 font-semibold text-navy">
                        {format(slot, viewMode === "day" ? "HH:00" : "HH:mm")}
                      </p>
                      {entries.map((reservation) => (
                        <button
                          type="button"
                          key={reservation.id}
                          disabled={!canManage}
                          onClick={() => openEditor(reservation)}
                          className="mb-1 w-full rounded-md border border-border bg-white p-2 text-left transition-colors hover:border-gold disabled:cursor-default disabled:hover:border-border"
                        >
                          <span className="flex items-center gap-1 font-medium text-navy">
                            <Move className="h-3 w-3 shrink-0" aria-hidden />
                            <span className="truncate">{reservation.panelName}</span>
                          </span>
                          <span className="mt-1 flex items-center gap-1 text-ink-soft">
                            <User className="h-3 w-3 shrink-0" aria-hidden />
                            <span className="truncate">{reservation.userName}</span>
                          </span>
                          <Badge variant="secondary" className="mt-2">
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

      <Dialog open={editingReservation != null} onOpenChange={() => setEditingReservation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remanejar slot</DialogTitle>
            <DialogDescription>
              {editingReservation?.panelName} · {editingReservation?.userName}
            </DialogDescription>
          </DialogHeader>
          {editingReservation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inventory-new-date">Nova data</Label>
                  <Input
                    id="inventory-new-date"
                    type="date"
                    value={newDate}
                    onChange={(event) => setNewDate(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inventory-new-time">Novo horário</Label>
                  <Input
                    id="inventory-new-time"
                    type="time"
                    step="300"
                    value={newStartTime}
                    onChange={(event) => setNewStartTime(event.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingReservation(null)}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={() => updateMutation.mutate()}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending && (
                    <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
                  )}
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
