import { useState, type ChangeEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

const MAX_FILE_SIZE = 2.5 * 1024 * 1024;
const ACCEPTED_TYPES = "video/mp4,video/quicktime,video/x-msvideo,image/jpeg,image/png";

async function uploadAsset(file: File, orderItemId: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("orderItemId", orderItemId);

  const { data, error } = await getBrowserSupabaseClient().functions.invoke("upload-asset", {
    body: formData,
  });
  if (error) throw error;
  if (data?.error) throw new Error(String(data.error));
  return data;
}

function useAssetUploadInvalidation() {
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["advertiser-order"] }),
      queryClient.invalidateQueries({ queryKey: ["advertiser-assets"] }),
      queryClient.invalidateQueries({ queryKey: ["advertiser-campaigns"] }),
      queryClient.invalidateQueries({ queryKey: ["advertiser-dashboard"] }),
    ]);
    await queryClient.refetchQueries({ queryKey: ["advertiser-order"], type: "active" });
  };
}

function validateSelectedFile(file: File | undefined): File | null {
  if (!file) return null;
  if (file.size > MAX_FILE_SIZE) {
    toast.error(
      `Arquivo muito grande. Máximo: 2,5 MB. Selecionado: ${(file.size / 1024 / 1024).toFixed(2)} MB.`,
    );
    return null;
  }
  return file;
}

export function AssetUploader({
  orderItemId,
  onSuccess,
  onCancel,
}: {
  orderItemId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const invalidate = useAssetUploadInvalidation();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = validateSelectedFile(event.target.files?.[0]);
    if (!selectedFile) event.target.value = "";
    setFile(selectedFile);
  }

  async function handleUpload() {
    if (!file || uploading) return;
    setUploading(true);
    try {
      await uploadAsset(file, orderItemId);
      await invalidate();
      toast.success("Mídia enviada com sucesso. Aguarde a aprovação.");
      onSuccess();
    } catch (error) {
      toast.error(
        `Erro ao enviar mídia: ${error instanceof Error ? error.message : "tente novamente"}`,
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-border bg-off-white p-4">
      <div className="space-y-2">
        <Label htmlFor={`asset-${orderItemId}`}>Arquivo de mídia</Label>
        <Input
          id={`asset-${orderItemId}`}
          type="file"
          accept={ACCEPTED_TYPES}
          onChange={handleFileChange}
          disabled={uploading}
          className="bg-white"
        />
        <p className="text-xs text-ink-soft">MP4, AVI, MOV, JPG ou PNG. Máximo de 2,5 MB.</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" onClick={() => void handleUpload()} disabled={!file || uploading}>
          {uploading ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Upload className="h-4 w-4" aria-hidden />
          )}
          {uploading ? "Enviando..." : "Enviar"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={uploading}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

export function BulkAssetUploader({
  orderItems,
  onSuccess,
  onCancel,
}: {
  orderItems: Array<{ id: string; panelName: string }>;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const invalidate = useAssetUploadInvalidation();
  const [file, setFile] = useState<File | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);

  function toggleItem(itemId: string) {
    setSelectedItems((current) => {
      const next = new Set(current);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  async function handleUpload() {
    if (!file || selectedItems.size === 0 || uploading) return;
    setUploading(true);
    try {
      await Promise.all([...selectedItems].map((itemId) => uploadAsset(file, itemId)));
      await invalidate();
      toast.success(`Mídia enviada para ${selectedItems.size} painéis. Aguarde a aprovação.`);
      onSuccess();
    } catch (error) {
      toast.error(
        `Erro ao enviar mídia: ${error instanceof Error ? error.message : "tente novamente"}`,
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-lg border border-gold/35 bg-gold/8 p-5 sm:p-6">
      <h3 className="text-lg font-semibold text-navy">Upload em lote</h3>
      <p className="mt-1 text-sm text-ink-soft">
        Envie a mesma mídia para múltiplos painéis de uma só vez.
      </p>

      <div className="mt-5 space-y-2">
        <Label htmlFor="bulk-asset">Arquivo de mídia</Label>
        <Input
          id="bulk-asset"
          type="file"
          accept={ACCEPTED_TYPES}
          disabled={uploading}
          className="bg-white"
          onChange={(event) => {
            const selectedFile = validateSelectedFile(event.target.files?.[0]);
            if (!selectedFile) event.target.value = "";
            setFile(selectedFile);
          }}
        />
        <p className="text-xs text-ink-soft">MP4, AVI, MOV, JPG ou PNG. Máximo de 2,5 MB.</p>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <Label>Painéis sem mídia</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSelectedItems(new Set(orderItems.map((item) => item.id)))}
          >
            Selecionar todos
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSelectedItems(new Set())}
          >
            Limpar
          </Button>
        </div>
      </div>
      <div className="mt-3 max-h-60 space-y-2 overflow-y-auto rounded-lg border border-border bg-white p-4">
        {orderItems.map((item) => (
          <label
            key={item.id}
            className="flex min-h-9 cursor-pointer items-center gap-3 text-sm text-navy"
          >
            <input
              type="checkbox"
              checked={selectedItems.has(item.id)}
              onChange={() => toggleItem(item.id)}
              className="h-4 w-4 accent-gold-deep"
            />
            {item.panelName}
          </label>
        ))}
      </div>
      <p className="mt-2 text-xs text-ink-soft">{selectedItems.size} painel(is) selecionado(s)</p>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() => void handleUpload()}
          disabled={!file || selectedItems.size === 0 || uploading}
        >
          {uploading ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Upload className="h-4 w-4" aria-hidden />
          )}
          {uploading ? "Enviando..." : `Enviar para ${selectedItems.size} painel(is)`}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={uploading}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
