import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, Clock, Edit, LoaderCircle, Plus, Trash2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  adminPanelHoursQueryOptions,
  deleteAdminPanelHour,
  deleteAdminPanelHourException,
  saveAdminPanelHour,
  saveAdminPanelHourException,
} from "@/lib/admin/operations";
import type {
  AdminOperationalPanel,
  AdminPanelHour,
  AdminPanelHourException,
  AdminPanelHoursData,
} from "@/lib/admin/types";
import type { AuthUser } from "@/lib/auth/types";

const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function minutesBetween(start: string, end: string): number {
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  return endHour * 60 + endMinute - (startHour * 60 + startMinute);
}

function PanelSelect({
  id,
  value,
  panels,
  onChange,
}: {
  id: string;
  value: string;
  panels: AdminOperationalPanel[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
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
  );
}

function HourForm({
  hour,
  panels,
  onSaved,
}: {
  hour: AdminPanelHour | null;
  panels: AdminOperationalPanel[];
  onSaved: () => void;
}) {
  const save = useServerFn(saveAdminPanelHour);
  const queryClient = useQueryClient();
  const [panelId, setPanelId] = useState(hour?.panelId ?? "");
  const [weekday, setWeekday] = useState(String(hour?.weekday ?? ""));
  const [startTime, setStartTime] = useState(hour?.startTime.slice(0, 5) ?? "");
  const [endTime, setEndTime] = useState(hour?.endTime.slice(0, 5) ?? "");
  const mutation = useMutation({
    mutationFn: () =>
      save({
        data: {
          id: hour?.id,
          panelId,
          weekday: weekday === "" ? -1 : Number(weekday),
          startTime,
          endTime,
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-panel-hours"] });
      toast.success(hour ? "Horário atualizado." : "Horário criado.");
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
        <Label htmlFor="hour-panel">Painel</Label>
        <PanelSelect id="hour-panel" value={panelId} panels={panels} onChange={setPanelId} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="hour-weekday">Dia da semana</Label>
        <select
          id="hour-weekday"
          value={weekday}
          onChange={(event) => setWeekday(event.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          required
        >
          <option value="">Selecione o dia</option>
          {WEEKDAYS.map((label, index) => (
            <option key={label} value={index}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="hour-start">Hora início</Label>
          <Input
            id="hour-start"
            type="time"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hour-end">Hora fim</Label>
          <Input
            id="hour-end"
            type="time"
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
            required
          />
        </div>
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

function ExceptionForm({
  exception,
  panels,
  onSaved,
}: {
  exception: AdminPanelHourException | null;
  panels: AdminOperationalPanel[];
  onSaved: () => void;
}) {
  const save = useServerFn(saveAdminPanelHourException);
  const queryClient = useQueryClient();
  const [panelId, setPanelId] = useState(exception?.panelId ?? "");
  const [date, setDate] = useState(exception?.date ?? "");
  const [closed, setClosed] = useState(exception ? exception.startTime == null : false);
  const [startTime, setStartTime] = useState(exception?.startTime?.slice(0, 5) ?? "");
  const [endTime, setEndTime] = useState(exception?.endTime?.slice(0, 5) ?? "");
  const mutation = useMutation({
    mutationFn: () =>
      save({
        data: {
          id: exception?.id,
          panelId,
          date,
          startTime: closed ? null : startTime,
          endTime: closed ? null : endTime,
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-panel-hours"] });
      toast.success(exception ? "Exceção atualizada." : "Exceção criada.");
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
        <Label htmlFor="exception-panel">Painel</Label>
        <PanelSelect id="exception-panel" value={panelId} panels={panels} onChange={setPanelId} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="exception-date">Data especial</Label>
        <Input
          id="exception-date"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          required
        />
      </div>
      <div className="flex items-center gap-3 rounded-md border border-border bg-off-white px-4 py-3">
        <Switch id="exception-closed" checked={closed} onCheckedChange={setClosed} />
        <Label htmlFor="exception-closed">Fechado durante todo o dia</Label>
      </div>
      {!closed && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="exception-start">Hora início</Label>
            <Input
              id="exception-start"
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="exception-end">Hora fim</Label>
            <Input
              id="exception-end"
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              required
            />
          </div>
        </div>
      )}
      <div className="flex justify-end">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />}
          Salvar
        </Button>
      </div>
    </form>
  );
}

export function AdminHoursPage({
  user,
  initialData,
}: {
  user: AuthUser;
  initialData: AdminPanelHoursData;
}) {
  const canManage = user.roles.includes("admin");
  const { data } = useQuery({ ...adminPanelHoursQueryOptions(user.id), initialData });
  const removeHour = useServerFn(deleteAdminPanelHour);
  const removeException = useServerFn(deleteAdminPanelHourException);
  const queryClient = useQueryClient();
  const [hourDialogOpen, setHourDialogOpen] = useState(false);
  const [exceptionDialogOpen, setExceptionDialogOpen] = useState(false);
  const [editingHour, setEditingHour] = useState<AdminPanelHour | null>(null);
  const [editingException, setEditingException] = useState<AdminPanelHourException | null>(null);
  const deleteHourMutation = useMutation({
    mutationFn: (id: string) => removeHour({ data: { id } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-panel-hours"] });
      toast.success("Horário excluído.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao excluir."),
  });
  const deleteExceptionMutation = useMutation({
    mutationFn: (id: string) => removeException({ data: { id } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-panel-hours"] });
      toast.success("Exceção excluída.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao excluir."),
  });
  const panelStats = useMemo(() => {
    return data.panels
      .map((panel) => {
        const hours = data.hours.filter((hour) => hour.panelId === panel.id);
        if (hours.length === 0) return null;
        const durations = [
          ...new Set(
            data.formats
              .filter((formatEntry) => formatEntry.panelId === panel.id)
              .flatMap((formatEntry) => formatEntry.durationsAllowed),
          ),
        ];
        const totalSlots = hours.reduce((total, hour) => {
          const seconds = minutesBetween(hour.startTime, hour.endTime) * 60;
          return (
            total + durations.reduce((sum, duration) => sum + Math.floor(seconds / duration), 0)
          );
        }, 0);
        const filledSlots = data.futureReservations.filter(
          (reservation) => reservation.panelId === panel.id,
        ).length;
        return {
          panel,
          hours,
          durations,
          totalSlots,
          filledSlots,
          hoursPerWeek: hours.reduce(
            (total, hour) => total + minutesBetween(hour.startTime, hour.endTime) / 60,
            0,
          ),
        };
      })
      .filter((value): value is NonNullable<typeof value> => value != null);
  }, [data]);

  return (
    <div className="space-y-7">
      <AdminPageHeader
        eyebrow="Horários"
        title="Horários de funcionamento"
        description="Configure a grade semanal e as exceções de datas especiais dos painéis."
      />
      {!canManage && <AdminReadOnlyNotice />}

      <Tabs defaultValue="weekly" className="space-y-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <TabsList>
            <TabsTrigger value="weekly">Grade semanal</TabsTrigger>
            <TabsTrigger value="exceptions">Exceções</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="weekly" className="space-y-4">
          {canManage && (
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => {
                  setEditingHour(null);
                  setHourDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4" aria-hidden />
                Novo horário
              </Button>
            </div>
          )}
          {panelStats.length === 0 ? (
            <AdminEmptyState message="Nenhum horário semanal cadastrado." />
          ) : (
            panelStats.map((stats) => {
              const fillRate =
                stats.totalSlots > 0 ? (stats.filledSlots / stats.totalSlots) * 100 : 0;
              return (
                <section key={stats.panel.id} className="rounded-lg border border-border bg-white">
                  <header className="border-b border-border px-5 py-4 sm:px-6">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-semibold text-navy">{stats.panel.name}</h2>
                          <Badge variant="outline">{fillRate.toFixed(0)}% preenchido</Badge>
                        </div>
                        <p className="mt-2 text-sm text-ink-soft">
                          {stats.hoursPerWeek.toFixed(1)}h/semana ·{" "}
                          {stats.totalSlots.toLocaleString("pt-BR")} slots · {stats.filledSlots}{" "}
                          preenchidos
                        </p>
                        {stats.durations.length > 0 && (
                          <p className="mt-1 text-xs text-ink-soft">
                            Durações: {stats.durations.map((duration) => `${duration}s`).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  </header>
                  <div className="divide-y divide-border px-5 sm:px-6">
                    {stats.hours.map((hour) => (
                      <div key={hour.id} className="flex items-center justify-between gap-4 py-4">
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-teal" aria-hidden />
                          <div>
                            <p className="text-sm font-semibold text-navy">
                              {WEEKDAYS[hour.weekday]}
                            </p>
                            <p className="text-sm text-ink-soft">
                              {hour.startTime.slice(0, 5)} - {hour.endTime.slice(0, 5)}
                            </p>
                          </div>
                        </div>
                        {canManage && (
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              title="Editar horário"
                              onClick={() => {
                                setEditingHour(hour);
                                setHourDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" aria-hidden />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              title="Excluir horário"
                              disabled={deleteHourMutation.isPending}
                              onClick={() => {
                                if (
                                  window.confirm("Tem certeza que deseja excluir este horário?")
                                ) {
                                  deleteHourMutation.mutate(hour.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" aria-hidden />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="exceptions" className="space-y-4">
          {canManage && (
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => {
                  setEditingException(null);
                  setExceptionDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4" aria-hidden />
                Nova exceção
              </Button>
            </div>
          )}
          {data.exceptions.length === 0 ? (
            <AdminEmptyState message="Nenhuma exceção de horário cadastrada." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.exceptions.map((exception) => (
                <article
                  key={exception.id}
                  className="rounded-lg border border-border bg-white p-5"
                >
                  <div className="flex items-start gap-3">
                    <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden />
                    <div>
                      <h2 className="font-semibold text-navy">{exception.panelName}</h2>
                      <p className="mt-1 text-sm capitalize text-ink-soft">
                        {format(parseISO(exception.date), "dd 'de' MMMM 'de' yyyy", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm font-medium text-navy">
                    {exception.startTime && exception.endTime
                      ? `${exception.startTime.slice(0, 5)} - ${exception.endTime.slice(0, 5)}`
                      : "Fechado durante todo o dia"}
                  </p>
                  {canManage && (
                    <div className="mt-5 flex gap-2 border-t border-border pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        title="Editar exceção"
                        onClick={() => {
                          setEditingException(exception);
                          setExceptionDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" aria-hidden />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        title="Excluir exceção"
                        disabled={deleteExceptionMutation.isPending}
                        onClick={() => {
                          if (window.confirm("Tem certeza que deseja excluir esta exceção?")) {
                            deleteExceptionMutation.mutate(exception.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </Button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={hourDialogOpen} onOpenChange={setHourDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingHour ? "Editar horário" : "Novo horário"}</DialogTitle>
            <DialogDescription>Faixa semanal de funcionamento do painel.</DialogDescription>
          </DialogHeader>
          <HourForm
            key={editingHour?.id ?? "new"}
            hour={editingHour}
            panels={data.panels}
            onSaved={() => setHourDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={exceptionDialogOpen} onOpenChange={setExceptionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingException ? "Editar exceção" : "Nova exceção"}</DialogTitle>
            <DialogDescription>
              Disponibilidade especial para uma data específica.
            </DialogDescription>
          </DialogHeader>
          <ExceptionForm
            key={editingException?.id ?? "new"}
            exception={editingException}
            panels={data.panels}
            onSaved={() => setExceptionDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
