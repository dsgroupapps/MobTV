import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Edit, LoaderCircle, MapPin, Plus } from "lucide-react";
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
import { adminPanelsQueryOptions, saveAdminPanel } from "@/lib/admin/operations";
import type { AdminOperationalPanel } from "@/lib/admin/types";
import type { AuthUser } from "@/lib/auth/types";

function PanelForm({
  panel,
  onSaved,
}: {
  panel: AdminOperationalPanel | null;
  onSaved: () => void;
}) {
  const save = useServerFn(saveAdminPanel);
  const queryClient = useQueryClient();
  const [name, setName] = useState(panel?.name ?? "");
  const [region, setRegion] = useState(panel?.region ?? "");
  const [address, setAddress] = useState(panel?.address ?? "");
  const [timezone, setTimezone] = useState(panel?.timezone ?? "America/Sao_Paulo");
  const [active, setActive] = useState(panel?.active ?? true);
  const mutation = useMutation({
    mutationFn: () => save({ data: { id: panel?.id, name, region, address, timezone, active } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-operational-panels"] });
      toast.success(panel ? "Painel atualizado." : "Painel criado.");
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
        <Label htmlFor="panel-name">Nome do painel</Label>
        <Input
          id="panel-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="panel-region">Região</Label>
          <Input
            id="panel-region"
            value={region}
            onChange={(event) => setRegion(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="panel-timezone">Timezone</Label>
          <Input
            id="panel-timezone"
            value={timezone}
            onChange={(event) => setTimezone(event.target.value)}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="panel-address">Endereço</Label>
        <Input
          id="panel-address"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          required
        />
      </div>
      <div className="flex items-center gap-3 rounded-md border border-border bg-off-white px-4 py-3">
        <Switch id="panel-active" checked={active} onCheckedChange={setActive} />
        <Label htmlFor="panel-active">Painel ativo</Label>
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

export function AdminPanelsPage({
  user,
  initialData,
}: {
  user: AuthUser;
  initialData: AdminOperationalPanel[];
}) {
  const canManage = user.roles.includes("admin");
  const { data: panels = [] } = useQuery({ ...adminPanelsQueryOptions(user.id), initialData });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPanel, setEditingPanel] = useState<AdminOperationalPanel | null>(null);

  function openEditor(panel: AdminOperationalPanel | null) {
    setEditingPanel(panel);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-7">
      <AdminPageHeader
        eyebrow="Inventário / Ativos"
        title="Gerenciamento de painéis"
        description="Cadastre e mantenha os ativos operacionais usados nas campanhas."
        action={
          canManage ? (
            <Button type="button" onClick={() => openEditor(null)}>
              <Plus className="h-4 w-4" aria-hidden />
              Novo painel
            </Button>
          ) : undefined
        }
      />
      {!canManage && <AdminReadOnlyNotice />}

      {panels.length === 0 ? (
        <AdminEmptyState message="Nenhum painel cadastrado." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {panels.map((panel) => (
            <article key={panel.id} className="rounded-lg border border-border bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-navy">{panel.name}</h2>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
                    <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {panel.region}
                  </p>
                </div>
                <Badge variant={panel.active ? "default" : "secondary"}>
                  {panel.active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <div className="mt-5 space-y-1.5 text-sm text-ink-soft">
                <p>{panel.address}</p>
                <p className="font-mono text-xs">{panel.timezone}</p>
              </div>
              {canManage && (
                <div className="mt-5 border-t border-border pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openEditor(panel)}
                  >
                    <Edit className="h-4 w-4" aria-hidden />
                    Editar
                  </Button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPanel ? "Editar painel" : "Novo painel"}</DialogTitle>
            <DialogDescription>
              Dados do ativo operacional e seu status comercial.
            </DialogDescription>
          </DialogHeader>
          <PanelForm
            key={editingPanel?.id ?? "new"}
            panel={editingPanel}
            onSaved={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
