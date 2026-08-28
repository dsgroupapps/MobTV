import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Edit, LoaderCircle, Monitor, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AdminEmptyState, AdminPageHeader, AdminReadOnlyNotice } from "./AdminResourceUi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  adminPanelFormatsQueryOptions,
  deleteAdminPanelFormat,
  saveAdminPanelFormat,
} from "@/lib/admin/operations";
import type { AdminOperationalPanel, AdminPanelFormat } from "@/lib/admin/types";
import type { AuthUser } from "@/lib/auth/types";

const DURATIONS = [10, 15, 20, 30, 45, 60] as const;
type DurationOption = (typeof DURATIONS)[number];

function FormatForm({
  format,
  panels,
  onSaved,
}: {
  format: AdminPanelFormat | null;
  panels: AdminOperationalPanel[];
  onSaved: () => void;
}) {
  const save = useServerFn(saveAdminPanelFormat);
  const queryClient = useQueryClient();
  const [panelId, setPanelId] = useState(format?.panelId ?? "");
  const [width, setWidth] = useState(String(format?.width ?? 1920));
  const [height, setHeight] = useState(String(format?.height ?? 1080));
  const [orientation, setOrientation] = useState<"horizontal" | "vertical" | "ribbon">(
    format?.orientation ?? "horizontal",
  );
  const [durations, setDurations] = useState<DurationOption[]>(
    format?.durationsAllowed.filter((value): value is DurationOption =>
      DURATIONS.includes(value as DurationOption),
    ) ?? [15, 30],
  );
  const mutation = useMutation({
    mutationFn: () =>
      save({
        data: {
          id: format?.id,
          panelId,
          width: Number(width),
          height: Number(height),
          orientation,
          durationsAllowed: durations,
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-panel-formats"] });
      toast.success(format ? "Formato atualizado." : "Formato criado.");
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
        <Label htmlFor="format-panel">Painel</Label>
        <select
          id="format-panel"
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="format-width">Largura (px)</Label>
          <Input
            id="format-width"
            type="number"
            min="1"
            value={width}
            onChange={(event) => setWidth(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="format-height">Altura (px)</Label>
          <Input
            id="format-height"
            type="number"
            min="1"
            value={height}
            onChange={(event) => setHeight(event.target.value)}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="format-orientation">Orientação</Label>
        <select
          id="format-orientation"
          value={orientation}
          onChange={(event) => setOrientation(event.target.value as typeof orientation)}
          className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          <option value="horizontal">Horizontal</option>
          <option value="vertical">Vertical</option>
          <option value="ribbon">Ribbon</option>
        </select>
      </div>
      <fieldset>
        <legend className="text-sm font-medium text-navy">Durações permitidas</legend>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {DURATIONS.map((duration) => (
            <label key={duration} className="flex items-center gap-2 text-sm text-ink">
              <Checkbox
                checked={durations.includes(duration)}
                onCheckedChange={() =>
                  setDurations((current) =>
                    current.includes(duration)
                      ? current.filter((item) => item !== duration)
                      : [...current, duration].sort((a, b) => a - b),
                  )
                }
              />
              {duration}s
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex justify-end">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />}
          Salvar
        </Button>
      </div>
    </form>
  );
}

export function AdminFormatsPage({
  user,
  initialData,
}: {
  user: AuthUser;
  initialData: { panels: AdminOperationalPanel[]; formats: AdminPanelFormat[] };
}) {
  const canManage = user.roles.includes("admin");
  const { data } = useQuery({ ...adminPanelFormatsQueryOptions(user.id), initialData });
  const remove = useServerFn(deleteAdminPanelFormat);
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFormat, setEditingFormat] = useState<AdminPanelFormat | null>(null);
  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-panel-formats"] });
      toast.success("Formato excluído.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao excluir."),
  });

  function openEditor(format: AdminPanelFormat | null) {
    setEditingFormat(format);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-7">
      <AdminPageHeader
        eyebrow="Formatos"
        title="Formatos de painéis"
        description="Configure resolução, orientação e durações aceitas por ativo."
        action={
          canManage ? (
            <Button type="button" onClick={() => openEditor(null)}>
              <Plus className="h-4 w-4" aria-hidden />
              Novo formato
            </Button>
          ) : undefined
        }
      />
      {!canManage && <AdminReadOnlyNotice />}

      {data.formats.length === 0 ? (
        <AdminEmptyState message="Nenhum formato cadastrado." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.formats.map((format) => (
            <article key={format.id} className="rounded-lg border border-border bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="flex items-center gap-2 truncate text-lg font-semibold text-navy">
                    <Monitor className="h-4 w-4 shrink-0 text-teal" aria-hidden />
                    {format.panelName}
                  </h2>
                  <p className="mt-2 text-sm text-ink-soft">
                    {format.width} × {format.height}px
                  </p>
                </div>
                <Badge variant="outline">{format.orientation}</Badge>
              </div>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {format.durationsAllowed.map((duration) => (
                  <Badge key={duration} variant="secondary">
                    {duration}s
                  </Badge>
                ))}
              </div>
              {canManage && (
                <div className="mt-5 flex gap-2 border-t border-border pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openEditor(format)}
                  >
                    <Edit className="h-4 w-4" aria-hidden />
                    Editar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    title="Excluir formato"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (window.confirm("Tem certeza que deseja excluir este formato?")) {
                        deleteMutation.mutate(format.id);
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingFormat ? "Editar formato" : "Novo formato"}</DialogTitle>
            <DialogDescription>
              Formato técnico associado a um painel operacional.
            </DialogDescription>
          </DialogHeader>
          <FormatForm
            key={editingFormat?.id ?? "new"}
            format={editingFormat}
            panels={data.panels}
            onSaved={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
