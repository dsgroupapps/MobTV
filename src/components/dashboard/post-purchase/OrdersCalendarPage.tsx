import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, ChevronRight, LoaderCircle, Move } from "lucide-react";
import { addDays, format } from "date-fns";
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
import {
  advertiserCalendarReservationsQueryOptions,
  rescheduleAdvertiserOrderItem,
} from "@/lib/advertiser/calendar";
import {
  generateCalendarTimeSlots,
  reservationsForCalendarSlot,
} from "@/lib/advertiser/calendar-view";
import type {
  AdvertiserCalendarPanel,
  AdvertiserCalendarReservation,
} from "@/lib/advertiser/types";
import { cn } from "@/lib/utils";

export function OrdersCalendarPage({
  userId,
  panels,
}: {
  userId: string;
  panels: AdvertiserCalendarPanel[];
}) {
  const queryClient = useQueryClient();
  const reschedule = useServerFn(rescheduleAdvertiserOrderItem);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedPanel, setSelectedPanel] = useState<string | null>(null);
  const [editingReservation, setEditingReservation] =
    useState<AdvertiserCalendarReservation | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newStartTime, setNewStartTime] = useState("");
  const dateKey = format(selectedDate, "yyyy-MM-dd");
  const queryOptions = advertiserCalendarReservationsQueryOptions(userId, dateKey, selectedPanel);
  const { data: reservations = [], isLoading, error } = useQuery(queryOptions);

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editingReservation || !newDate || !newStartTime) {
        throw new Error("Informe a nova data e o novo horário.");
      }
      return reschedule({
        data: {
          orderItemId: editingReservation.id,
          date: newDate,
          startTime: newStartTime,
        },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["advertiser-calendar-reservations", userId],
      });
      await queryClient.invalidateQueries({ queryKey: ["advertiser-order"] });
      toast.success("Horário remarcado com sucesso.");
      setEditingReservation(null);
      setNewDate("");
      setNewStartTime("");
    },
    onError: (mutationError) => {
      toast.error(
        `Erro ao atualizar: ${mutationError instanceof Error ? mutationError.message : "tente novamente"}`,
      );
    },
  });

  function openEditDialog(reservation: AdvertiserCalendarReservation) {
    setEditingReservation(reservation);
    setNewDate(reservation.date);
    setNewStartTime(reservation.startTime);
  }

  return (
    <div className="space-y-7">
      <header>
        <p className="font-mono text-[11px] font-medium uppercase text-gold-deep">/ Calendário</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-navy sm:text-4xl">
          Minhas reservas
        </h1>
        <p className="mt-2 text-sm text-ink-soft sm:text-base">
          Visualize e reorganize suas reservas de mídia.
        </p>
      </header>

      <div className="grid gap-5 xl:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="self-start rounded-lg border border-border bg-white p-5">
          <h2 className="text-sm font-semibold text-navy">Filtros</h2>
          <div className="mt-5 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="calendar-panel">Painel</Label>
              <select
                id="calendar-panel"
                value={selectedPanel ?? "all"}
                onChange={(event) =>
                  setSelectedPanel(event.target.value === "all" ? null : event.target.value)
                }
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-navy ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <option value="all">Todos os painéis</option>
                {panels.map((panel) => (
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
            <h2 className="text-lg font-semibold capitalize text-navy">
              {format(selectedDate, "PPPP", { locale: ptBR })}
            </h2>
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
                {generateCalendarTimeSlots(selectedDate).map((slot) => {
                  const slotReservations = reservationsForCalendarSlot(slot, reservations);
                  return (
                    <div
                      key={slot.toISOString()}
                      className={cn(
                        "min-h-24 rounded-md border p-2 text-xs",
                        slotReservations.length > 0
                          ? "border-gold/50 bg-gold/8"
                          : "border-border bg-off-white",
                      )}
                    >
                      <p className="mb-2 font-semibold text-navy">{format(slot, "HH:mm")}</p>
                      {slotReservations.map((reservation) => (
                        <button
                          type="button"
                          key={reservation.id}
                          onClick={() => openEditDialog(reservation)}
                          className="mb-2 block w-full rounded-md border border-border bg-white p-2 text-left transition-colors hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                        >
                          <span className="flex items-center gap-1 font-medium text-navy">
                            <Move className="h-3 w-3 shrink-0 text-gold-deep" aria-hidden />
                            <span className="truncate">{reservation.panelName}</span>
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
        onOpenChange={(open) => {
          if (!open && !updateMutation.isPending) setEditingReservation(null);
        }}
      >
        <DialogContent className="border-border bg-white">
          <DialogHeader>
            <DialogTitle className="text-navy">Remarcar reserva</DialogTitle>
            <DialogDescription>Altere a data e o horário da sua reserva.</DialogDescription>
          </DialogHeader>
          {editingReservation && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-navy">Painel</p>
                <p className="mt-1 text-sm text-ink-soft">{editingReservation.panelName}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-date">Nova data</Label>
                <Input
                  id="new-date"
                  type="date"
                  value={newDate}
                  onChange={(event) => setNewDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-time">Novo horário</Label>
                <Input
                  id="new-time"
                  type="time"
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
                  onClick={() => updateMutation.mutate()}
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
