import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Edit, Eye, ImageIcon, LoaderCircle, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { AssetPreview } from "@/components/dashboard/post-purchase/AssetPreview";
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
import {
  adminFillerQueryOptions,
  cleanupAdminFillerUpload,
  createAdminFillerMedia,
  createAdminFillerUploadUrl,
  deleteAdminFillerMedia,
  toggleAdminFillerMedia,
  updateAdminFillerPanels,
} from "@/lib/admin/filler";
import type { AdminFillerData, AdminFillerMedia } from "@/lib/admin/types";
import type { AuthUser } from "@/lib/auth/types";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import { AdminEmptyState, AdminPageHeader } from "./AdminResourceUi";

const dateFormatter = new Intl.DateTimeFormat("pt-BR");
const defaultForm = {
  name: "",
  width: "1920",
  height: "1080",
  durationSeconds: "15",
  panelIds: [] as string[],
};

export function AdminFillerMediaPage({
  user,
  initialData,
}: {
  user: AuthUser;
  initialData: AdminFillerData;
}) {
  const { data } = useQuery({ ...adminFillerQueryOptions(user.id), initialData });
  const queryClient = useQueryClient();
  const createUploadUrl = useServerFn(createAdminFillerUploadUrl);
  const createMedia = useServerFn(createAdminFillerMedia);
  const cleanupUpload = useServerFn(cleanupAdminFillerUpload);
  const toggleMedia = useServerFn(toggleAdminFillerMedia);
  const updatePanels = useServerFn(updateAdminFillerPanels);
  const deleteMedia = useServerFn(deleteAdminFillerMedia);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewing, setViewing] = useState<AdminFillerMedia | null>(null);
  const [editing, setEditing] = useState<AdminFillerMedia | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState(defaultForm);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-filler"] });
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Selecione uma imagem ou vídeo.");
      const signed = await createUploadUrl({
        data: { fileName: file.name, contentType: file.type, size: file.size },
      });
      const { error: uploadError } = await getBrowserSupabaseClient()
        .storage.from("assets")
        .uploadToSignedUrl(signed.path, signed.token, file, { contentType: file.type });
      if (uploadError) throw uploadError;

      try {
        await createMedia({
          data: {
            name: form.name,
            type: file.type,
            width: Number(form.width),
            height: Number(form.height),
            durationSeconds: Number(form.durationSeconds),
            storagePath: signed.path,
            panelIds: form.panelIds,
          },
        });
      } catch (error) {
        await cleanupUpload({ data: { storagePath: signed.path } }).catch(() => undefined);
        throw error;
      }
    },
    onSuccess: async () => {
      await invalidate();
      toast.success("Mídia filler criada.");
      setCreateOpen(false);
      setFile(null);
      setForm(defaultForm);
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Erro ao criar mídia filler."),
  });
  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      toggleMedia({ data: { id, active } }),
    onSuccess: async () => {
      await invalidate();
      toast.success("Status atualizado.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao atualizar."),
  });
  const panelsMutation = useMutation({
    mutationFn: (media: AdminFillerMedia) =>
      updatePanels({ data: { id: media.id, panelIds: media.panelIds } }),
    onSuccess: async () => {
      await invalidate();
      toast.success("Painéis atualizados.");
      setEditing(null);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao atualizar."),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMedia({ data: { id } }),
    onSuccess: async (result) => {
      await invalidate();
      toast.success(
        result.storageRemoved
          ? "Mídia filler removida."
          : "Registro removido; o arquivo não pôde ser limpo do storage.",
      );
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao excluir."),
  });

  function handleCreate(event: FormEvent) {
    event.preventDefault();
    createMutation.mutate();
  }

  return (
    <div className="space-y-7">
      <AdminPageHeader
        eyebrow="Mídias"
        title="Mídias de preenchimento"
        description="Configure o conteúdo exibido quando não houver campanha paga ativa no player."
        action={
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Nova mídia
          </Button>
        }
      />

      {data.media.length === 0 ? (
        <AdminEmptyState message="Nenhuma mídia filler cadastrada." />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {data.media.map((media) => (
            <article
              key={media.id}
              className="overflow-hidden rounded-lg border border-border bg-white"
            >
              <AssetPreview
                storagePath={media.storagePath}
                type={media.type}
                className="aspect-video w-full bg-off-white object-cover"
              />
              <div className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-navy" title={media.name}>
                      {media.name}
                    </h2>
                    <p className="mt-1 text-xs text-ink-soft">
                      {media.width} × {media.height} · {media.durationSeconds}s
                    </p>
                  </div>
                  <Switch
                    checked={media.active}
                    disabled={toggleMutation.isPending}
                    aria-label={`${media.active ? "Desativar" : "Ativar"} ${media.name}`}
                    onCheckedChange={(active) => toggleMutation.mutate({ id: media.id, active })}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    {media.panelIds.length > 0
                      ? `${media.panelIds.length} painéis`
                      : "Todos os painéis"}
                  </Badge>
                  <span className="text-xs text-ink-soft">
                    {dateFormatter.format(new Date(media.createdAt))}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" variant="outline" onClick={() => setViewing(media)}>
                    <Eye className="h-4 w-4" aria-hidden />
                    Ver
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditing({ ...media, panelIds: [...media.panelIds] })}
                  >
                    <Edit className="h-4 w-4" aria-hidden />
                    Editar
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(media.id)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  Remover
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar mídia de preenchimento</DialogTitle>
            <DialogDescription>
              Envie uma imagem ou vídeo para preencher espaços vazios da programação.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="filler-file">Arquivo</Label>
              <Input
                id="filler-file"
                type="file"
                accept="image/*,video/*"
                required
                onChange={(event) => {
                  const selected = event.target.files?.[0] ?? null;
                  setFile(selected);
                  if (selected && !form.name)
                    setForm((current) => ({ ...current, name: selected.name }));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filler-name">Nome</Label>
              <Input
                id="filler-name"
                value={form.name}
                maxLength={180}
                required
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <NumberField
                id="filler-width"
                label="Largura (px)"
                value={form.width}
                onChange={(width) => setForm((current) => ({ ...current, width }))}
              />
              <NumberField
                id="filler-height"
                label="Altura (px)"
                value={form.height}
                onChange={(height) => setForm((current) => ({ ...current, height }))}
              />
            </div>
            <NumberField
              id="filler-duration"
              label="Duração (segundos)"
              value={form.durationSeconds}
              onChange={(durationSeconds) =>
                setForm((current) => ({ ...current, durationSeconds }))
              }
            />
            <PanelSelector
              panels={data.panels}
              selected={form.panelIds}
              onChange={(panelIds) => setForm((current) => ({ ...current, panelIds }))}
            />
            <Button type="submit" className="w-full" disabled={!file || createMutation.isPending}>
              {createMutation.isPending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Upload className="h-4 w-4" aria-hidden />
              )}
              {createMutation.isPending ? "Enviando..." : "Enviar mídia"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar painéis</DialogTitle>
            <DialogDescription>
              Deixe todos desmarcados para usar em todos os painéis.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                panelsMutation.mutate(editing);
              }}
            >
              <PanelSelector
                panels={data.panels}
                selected={editing.panelIds}
                onChange={(panelIds) => setEditing({ ...editing, panelIds })}
              />
              <Button type="submit" className="w-full" disabled={panelsMutation.isPending}>
                {panelsMutation.isPending && (
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
                )}
                Salvar alterações
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(viewing)} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{viewing?.name}</DialogTitle>
            <DialogDescription>Pré-visualização da mídia de preenchimento.</DialogDescription>
          </DialogHeader>
          {viewing ? (
            <AssetPreview
              storagePath={viewing.storagePath}
              type={viewing.type}
              className="aspect-video max-h-[70vh] w-full rounded-md bg-off-white object-contain"
            />
          ) : (
            <div className="flex aspect-video items-center justify-center bg-off-white">
              <ImageIcon className="h-10 w-10 text-ink-soft" aria-hidden />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NumberField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min="1"
        value={value}
        required
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function PanelSelector({
  panels,
  selected,
  onChange,
}: {
  panels: Array<{ id: string; name: string }>;
  selected: string[];
  onChange: (panelIds: string[]) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-navy">Painéis</legend>
      <p className="text-xs text-ink-soft">Deixe vazio para aplicar a todos.</p>
      <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-border p-3">
        {panels.length === 0 ? (
          <p className="text-sm text-ink-soft">Nenhum painel ativo.</p>
        ) : (
          panels.map((panel) => (
            <label
              key={panel.id}
              className="flex min-h-9 cursor-pointer items-center gap-3 text-sm text-navy"
            >
              <input
                type="checkbox"
                checked={selected.includes(panel.id)}
                onChange={(event) =>
                  onChange(
                    event.target.checked
                      ? [...selected, panel.id]
                      : selected.filter((id) => id !== panel.id),
                  )
                }
                className="h-4 w-4 accent-teal"
              />
              {panel.name}
            </label>
          ))
        )}
      </div>
    </fieldset>
  );
}
