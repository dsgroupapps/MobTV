import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, LoaderCircle, MapPin, Monitor } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CAMPAIGN_PANEL_DAILY_PRICE,
  calculateCampaignTotal,
  type CampaignBrief,
  type CampaignPanel,
} from "@/lib/campaign/business";
import { createCampaignQuote } from "@/lib/campaign/functions";
import {
  readCampaignBrief,
  readSelectedPanels,
  writeCurrentQuote,
  writeSelectedPanels,
} from "@/lib/campaign/storage";
import { cn } from "@/lib/utils";
import { CampaignFlowHeader } from "./CampaignFlowHeader";
import { CampaignSummary } from "./CampaignSummary";

type PanelSelectionPageProps = {
  panels: CampaignPanel[];
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function PanelSelectionPage({ panels }: PanelSelectionPageProps) {
  const navigate = useNavigate();
  const createQuote = useServerFn(createCampaignQuote);
  const [quoteData, setQuoteData] = useState<CampaignBrief | null>(null);
  const [selectedPanelIds, setSelectedPanelIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedQuote = readCampaignBrief();
    if (!storedQuote) {
      void navigate({ to: "/dashboard/campanhas/nova" });
      return;
    }

    setQuoteData(storedQuote);
    const validIds = new Set(panels.map((panel) => panel.id));
    setSelectedPanelIds(
      readSelectedPanels()
        .map((panel) => panel.id)
        .filter((id) => validIds.has(id)),
    );
  }, [navigate, panels]);

  const selectedPanels = useMemo(
    () => panels.filter((panel) => selectedPanelIds.includes(panel.id)),
    [panels, selectedPanelIds],
  );

  const quoteMutation = useMutation({
    mutationFn: async () => {
      if (!quoteData) throw new Error("Dados da campanha não encontrados.");
      return createQuote({ data: { quoteData, panelIds: selectedPanelIds } });
    },
    onSuccess: (quote) => {
      writeCurrentQuote(quote);
      toast.success("Orçamento gerado com sucesso!");
      void navigate({ to: "/dashboard/campanhas/nova/revisao" });
    },
    onError: (mutationError) => {
      const message = mutationError instanceof Error ? mutationError.message : "Erro inesperado.";
      setError(message);
      toast.error(`Erro ao gerar orçamento: ${message}`);
    },
  });

  function togglePanel(panelId: string) {
    const nextIds = selectedPanelIds.includes(panelId)
      ? selectedPanelIds.filter((id) => id !== panelId)
      : [...selectedPanelIds, panelId];
    setSelectedPanelIds(nextIds);
    writeSelectedPanels(panels.filter((panel) => nextIds.includes(panel.id)));
    setError(null);
  }

  function handleNext() {
    if (!quoteData || selectedPanelIds.length === 0) {
      setError("Selecione pelo menos um painel.");
      toast.error("Selecione pelo menos um painel");
      return;
    }

    writeSelectedPanels(selectedPanels);
    if (quoteData.type === "space") {
      void navigate({ to: "/dashboard/campanhas/nova/horarios" });
      return;
    }
    quoteMutation.mutate();
  }

  if (!quoteData) {
    return (
      <div className="flex min-h-64 items-center justify-center text-ink-soft">
        <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden />
        <span className="ml-2 text-sm">Carregando campanha...</span>
      </div>
    );
  }

  const estimatedTotal = calculateCampaignTotal(
    selectedPanelIds.length,
    quoteData.date_start,
    quoteData.date_end,
  );

  return (
    <div className="mx-auto max-w-6xl">
      <CampaignFlowHeader currentStep={2} />
      <h1 className="font-display text-3xl font-bold text-navy sm:text-4xl">
        Selecione os painéis
      </h1>
      <p className="mt-2 text-sm text-ink-soft sm:text-base">
        Escolha onde sua campanha será exibida.
      </p>

      <div className="mt-7 space-y-6">
        <CampaignSummary
          quoteData={quoteData}
          selectedLabel="Painéis selecionados"
          selectedCount={selectedPanelIds.length}
        />

        {panels.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {panels.map((panel) => {
              const isSelected = selectedPanelIds.includes(panel.id);
              return (
                <button
                  type="button"
                  key={panel.id}
                  onClick={() => togglePanel(panel.id)}
                  aria-pressed={isSelected}
                  className={cn(
                    "min-h-56 rounded-lg border border-border bg-white p-5 text-left transition-colors hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                    isSelected && "border-gold ring-1 ring-gold",
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold text-navy">{panel.name}</h2>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-soft">
                        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        {panel.region}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded border border-border bg-white",
                        isSelected && "border-gold bg-gold",
                      )}
                      aria-hidden
                    >
                      {isSelected && <span className="h-2 w-2 rounded-sm bg-navy" />}
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-ink-soft">{panel.address}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {panel.formats.slice(0, 2).map((format) => (
                      <Badge key={format.id} variant="outline" className="bg-off-white shadow-none">
                        {format.width} × {format.height}
                      </Badge>
                    ))}
                    {panel.formats.length === 0 && (
                      <Badge variant="outline" className="bg-off-white shadow-none">
                        <Monitor className="mr-1 h-3 w-3" aria-hidden />
                        Sem formato
                      </Badge>
                    )}
                  </div>
                  <p className="mt-5 font-display text-lg font-bold text-navy">
                    {currencyFormatter.format(CAMPAIGN_PANEL_DAILY_PRICE)}/dia
                  </p>
                </button>
              );
            })}
          </div>
        ) : (
          <section className="rounded-lg border border-border bg-white px-6 py-12 text-center">
            <Monitor className="mx-auto h-8 w-8 text-ink-soft/40" aria-hidden />
            <h2 className="mt-3 text-base font-semibold text-navy">Nenhum painel disponível</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Não há ativos comerciais ativos no momento.
            </p>
          </section>
        )}

        {selectedPanelIds.length > 0 && (
          <section className="rounded-lg border border-gold/35 bg-gold/8 px-5 py-4 sm:px-6">
            <p className="text-xs font-medium uppercase text-gold-deep">Total estimado</p>
            <p className="mt-1 font-display text-3xl font-bold text-navy">
              {currencyFormatter.format(estimatedTotal)}
            </p>
          </section>
        )}

        {error && (
          <p
            className="rounded-md border border-red/25 bg-red/8 px-4 py-3 text-sm text-red"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse justify-between gap-3 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => void navigate({ to: "/dashboard/campanhas/nova" })}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Voltar
          </Button>
          <Button
            type="button"
            onClick={handleNext}
            disabled={selectedPanelIds.length === 0 || quoteMutation.isPending}
            className="min-h-10"
          >
            {quoteMutation.isPending
              ? "Gerando..."
              : quoteData.type === "space"
                ? "Selecionar horários"
                : "Gerar orçamento"}
            {quoteMutation.isPending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <ArrowRight className="h-4 w-4" aria-hidden />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
