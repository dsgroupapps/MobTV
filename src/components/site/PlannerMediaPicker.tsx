import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, X } from "lucide-react";
import type { MediaTypeKey } from "@/data/network-points";
import { mediaTypeMeta } from "./MediaBadges";

/**
 * Etapa rápida de escolha de mídia para um ponto multimídia — mini-modal
 * centrado (funciona igual em desktop e mobile), sem tirar o usuário da
 * página. Só é aberto quando o ponto oferece 2+ tipos de mídia; ponto de
 * mídia única é adicionado direto pelo chamador.
 */
export function PlannerMediaPicker({
  open,
  pointName,
  categoryLabel,
  available,
  initialSelected,
  confirmLabel = "Adicionar ao planejador",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  pointName: string;
  categoryLabel: string;
  /** Tipos de mídia realmente oferecidos pelo ponto — nada fora disso é selecionável. */
  available: MediaTypeKey[];
  /** Pré-seleção (fluxo de edição). Vazio no fluxo de adição. */
  initialSelected: MediaTypeKey[];
  confirmLabel?: string;
  onConfirm: (media: MediaTypeKey[]) => void;
  onCancel: () => void;
}) {
  const [selected, setSelected] = useState<MediaTypeKey[]>(initialSelected);

  // Re-sincroniza sempre que o modal reabre para outro ponto / outra edição.
  useEffect(() => {
    if (open) setSelected(initialSelected.filter((m) => available.includes(m)));
  }, [open, pointName, initialSelected, available]);

  const toggle = (media: MediaTypeKey) => {
    setSelected((prev) =>
      prev.includes(media) ? prev.filter((m) => m !== media) : [...prev, media],
    );
  };

  const orderedSelection = available.filter((m) => selected.includes(m));
  const canConfirm = orderedSelection.length > 0;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          data-planner-media-picker
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-navy p-6 text-off-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-off-white/45">
                {categoryLabel}
              </div>
              <Dialog.Title className="mt-1 font-display text-xl font-bold leading-tight text-white">
                {pointName}
              </Dialog.Title>
            </div>
            <Dialog.Close
              aria-label="Fechar"
              className="shrink-0 cursor-pointer rounded-md p-1 text-white/40 transition-colors hover:text-white"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </Dialog.Close>
          </div>

          <Dialog.Description className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-gold">
            Escolha a mídia
          </Dialog.Description>

          <div className="mt-3 flex flex-col gap-2">
            {available.map((media) => {
              const meta = mediaTypeMeta[media];
              const Icon = meta.Icon;
              const isChecked = selected.includes(media);
              return (
                <button
                  key={media}
                  type="button"
                  role="checkbox"
                  aria-checked={isChecked}
                  data-media-checkbox={media}
                  onClick={() => toggle(media)}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl px-3.5 py-3 text-left ring-1 transition-all ${
                    isChecked
                      ? "bg-gold/10 ring-gold"
                      : "bg-white/[0.03] ring-white/10 hover:bg-white/[0.06] hover:ring-white/20"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border transition-colors ${
                      isChecked ? "border-gold bg-gold text-navy" : "border-white/25 bg-transparent"
                    }`}
                  >
                    {isChecked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider ${meta.className}`}
                  >
                    <Icon className="h-3 w-3" strokeWidth={2.4} />
                    {meta.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="cursor-pointer rounded-lg px-4 py-2.5 font-semibold text-off-white/60 transition-colors hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="button"
              data-planner-media-confirm
              disabled={!canConfirm}
              onClick={() => canConfirm && onConfirm(orderedSelection)}
              className="btn-primary px-5 py-2.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-gold"
            >
              {confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
