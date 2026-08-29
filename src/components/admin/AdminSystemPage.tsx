import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, LoaderCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clearAdminSystemData, SYSTEM_CLEAR_CONFIRMATION } from "@/lib/admin/system";
import { AdminPageHeader } from "./AdminResourceUi";

export function AdminSystemPage() {
  const clearData = useServerFn(clearAdminSystemData);
  const queryClient = useQueryClient();
  const [acknowledged, setAcknowledged] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [finalDialogOpen, setFinalDialogOpen] = useState(false);
  const canSubmit = acknowledged && confirmation === SYSTEM_CLEAR_CONFIRMATION;
  const mutation = useMutation({
    mutationFn: () =>
      clearData({
        data: { confirmation: SYSTEM_CLEAR_CONFIRMATION, acknowledged: true },
      }),
    onSuccess: () => {
      queryClient.clear();
      toast.success("Os dados operacionais foram removidos.");
      setAcknowledged(false);
      setConfirmation("");
      setFinalDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "A limpeza não pôde ser executada.");
      setFinalDialogOpen(false);
    },
  });

  return (
    <div className="space-y-7">
      <AdminPageHeader
        eyebrow="Sistema"
        title="Gerenciamento do sistema"
        description="Ferramentas administrativas isoladas para manutenção da plataforma."
      />

      <section className="overflow-hidden rounded-lg border border-red/35 bg-white">
        <header className="border-b border-red/20 bg-red/5 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2 text-red">
            <AlertTriangle className="h-5 w-5" aria-hidden />
            <h2 className="text-lg font-semibold">Zona de perigo</h2>
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            Ações irreversíveis que afetam todo o sistema.
          </p>
        </header>

        <div className="space-y-5 p-5 sm:p-6">
          <div className="rounded-md border border-red/20 bg-red/5 p-4 text-sm text-navy">
            <p className="font-semibold text-red">Remover todos os dados operacionais</p>
            <p className="mt-2 leading-6 text-ink-soft">
              Esta ação remove permanentemente mídias, pedidos, orçamentos, reservas, bloqueios de
              slots, logs de exibição e arquivos do storage. Usuários e configuração de inventário
              não fazem parte da limpeza legada.
            </p>
          </div>

          <label className="flex cursor-pointer items-start gap-3 text-sm text-navy">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(event) => setAcknowledged(event.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-red"
            />
            <span>
              Entendo que esta ação é permanente, afeta todos os clientes e não pode ser desfeita.
            </span>
          </label>

          <div className="max-w-xl space-y-2">
            <Label htmlFor="system-confirmation">
              Digite <strong>{SYSTEM_CLEAR_CONFIRMATION}</strong> para habilitar a confirmação
            </Label>
            <Input
              id="system-confirmation"
              value={confirmation}
              autoComplete="off"
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder={SYSTEM_CLEAR_CONFIRMATION}
            />
          </div>

          <Button
            type="button"
            variant="destructive"
            disabled={!canSubmit || mutation.isPending}
            onClick={() => setFinalDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Revisar exclusão definitiva
          </Button>
        </div>
      </section>

      <AlertDialog open={finalDialogOpen} onOpenChange={setFinalDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red">
              <AlertTriangle className="h-5 w-5" aria-hidden />
              Última confirmação
            </AlertDialogTitle>
            <AlertDialogDescription className="leading-6">
              Ao continuar, a Edge Function <code>admin-clear-data</code> iniciará imediatamente a
              exclusão dos dados operacionais e arquivos. Não existe restauração automática.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red text-white hover:bg-red/90"
              disabled={!canSubmit || mutation.isPending}
              onClick={(event) => {
                event.preventDefault();
                mutation.mutate();
              }}
            >
              {mutation.isPending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Trash2 className="h-4 w-4" aria-hidden />
              )}
              {mutation.isPending ? "Excluindo..." : "Excluir definitivamente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
