import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, CalendarDays, Clock3, LoaderCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  SPACE_DEFAULT_SLOT_PRICE,
  generateLegacyTimeSlots,
  type CampaignBrief,
  type CampaignPanel,
  type SelectedTimeSlot,
} from "@/lib/campaign/business";
import { createSpaceQuote } from "@/lib/campaign/functions";
import {
  readCampaignBrief,
  readSelectedPanels,
  readSelectedSlots,
  removeSelectedPanels,
  removeSelectedSlots,
  writeCurrentQuote,
  writeSelectedSlots,
} from "@/lib/campaign/storage";
import { cn } from "@/lib/utils";
import { CampaignFlowHeader } from "./CampaignFlowHeader";
import { CampaignSummary } from "./CampaignSummary";

const TIME_SLOTS = generateLegacyTimeSlots();
const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function TimeSlotSelectionPage() {
  const navigate = useNavigate();
  const createQuote = useServerFn(createSpaceQuote);
  const [quoteData, setQuoteData] = useState<CampaignBrief | null>(null);
  const [selectedPanels, setSelectedPanels] = useState<CampaignPanel[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedSlots, setSelectedSlots] = useState<SelectedTimeSlot[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedQuote = readCampaignBrief();
    const storedPanels = readSelectedPanels();
    if (!storedQuote || storedPanels.length === 0 || storedQuote.type !== "space") {
      void navigate({ to: "/dashboard/campanhas/nova" });
      return;
    }

    setQuoteData(storedQuote);
    setSelectedPanels(storedPanels);
    setSelectedDate(new Date(`${storedQuote.date_start}T12:00:00`));
    setSelectedSlots(readSelectedSlots());
  }, [navigate]);

  const quoteMutation = useMutation({
    mutationFn: async () => {
      if (!quoteData) throw new Error("Dados da campanha não encontrados.");
      return createQuote({ data: { quoteData, slots: selectedSlots } });
    },
    onSuccess: (quote) => {
      writeCurrentQuote(quote);
      removeSelectedPanels();
      removeSelectedSlots();
      toast.success("Orçamento gerado com sucesso!");
      void navigate({ to: "/dashboard/campanhas/nova/revisao" });
    },
    onError: (mutationError) => {
      const message = mutationError instanceof Error ? mutationError.message : "Erro inesperado.";
      setError(message);
      toast.error(`Erro ao gerar orçamento: ${message}`);
    },
  });

  function updateSlots(nextSlots: SelectedTimeSlot[]) {
    setSelectedSlots(nextSlots);
    writeSelectedSlots(nextSlots);
    setError(null);
  }

  function toggleSlot(panelId: string, date: string, time: string) {
    const exists = selectedSlots.some(
      (slot) => slot.panelId === panelId && slot.date === date && slot.time === time,
    );
    updateSlots(
      exists
        ? selectedSlots.filter(
            (slot) => !(slot.panelId === panelId && slot.date === date && slot.time === time),
          )
        : [...selectedSlots, { panelId, date, time }],
    );
  }

  function selectAllSlotsForDate(panelId: string, date: string) {
    const remaining = selectedSlots.filter(
      (slot) => !(slot.panelId === panelId && slot.date === date),
    );
    updateSlots([...remaining, ...TIME_SLOTS.map((time) => ({ panelId, date, time }))]);
  }

  function clearSlotsForDate(panelId: string, date: string) {
    updateSlots(selectedSlots.filter((slot) => !(slot.panelId === panelId && slot.date === date)));
  }

  if (!quoteData || selectedPanels.length === 0) {
    return (
      <div className="flex min-h-64 items-center justify-center text-ink-soft">
        <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden />
        <span className="ml-2 text-sm">Carregando horários...</span>
      </div>
    );
  }

  const dateString = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
  const estimatedTotal = selectedSlots.length * SPACE_DEFAULT_SLOT_PRICE;

  return (
    <div className="mx-auto max-w-6xl">
      <CampaignFlowHeader currentStep={3} />
      <h1 className="font-display text-3xl font-bold text-navy sm:text-4xl">
        Selecione os horários
      </h1>
      <p className="mt-2 text-sm text-ink-soft sm:text-base">
        Escolha as faixas horárias específicas para sua campanha.
      </p>

      <div className="mt-7 space-y-6">
        <CampaignSummary
          quoteData={quoteData}
          selectedLabel="Slots selecionados"
          selectedCount={selectedSlots.length}
        />

        <section className="rounded-lg border border-border bg-white p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold text-navy">
            <CalendarDays className="h-5 w-5 text-gold-deep" aria-hidden />
            Selecione a data
          </h2>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "mt-4 h-11 w-full justify-start bg-white text-left font-normal",
                  !selectedDate && "text-ink-soft",
                )}
              >
                <CalendarDays className="h-4 w-4" aria-hidden />
                {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : "Escolha uma data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => {
                  const start = new Date(`${quoteData.date_start}T12:00:00`);
                  const end = new Date(`${quoteData.date_end}T12:00:00`);
                  return date < start || date > end;
                }}
              />
            </PopoverContent>
          </Popover>
        </section>

        {dateString &&
          selectedPanels.map((panel) => {
            const slotsForDate = selectedSlots.filter(
              (slot) => slot.panelId === panel.id && slot.date === dateString,
            ).length;
            const slotsForPanel = selectedSlots.filter((slot) => slot.panelId === panel.id).length;
            const allSelected = slotsForDate === TIME_SLOTS.length;

            return (
              <section
                key={panel.id}
                className="overflow-hidden rounded-lg border border-border bg-white"
              >
                <header className="flex flex-col justify-between gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:px-6">
                  <div>
                    <h2 className="text-base font-semibold text-navy">{panel.name}</h2>
                    <p className="mt-1 text-xs text-ink-soft">{panel.region}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="shadow-none">
                      {slotsForPanel} slots
                    </Badge>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        allSelected
                          ? clearSlotsForDate(panel.id, dateString)
                          : selectAllSlotsForDate(panel.id, dateString)
                      }
                    >
                      {allSelected ? "Limpar seleção" : "Selecionar todos"}
                    </Button>
                  </div>
                </header>
                <div className="max-h-96 overflow-y-auto p-4 sm:p-5">
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-8">
                    {TIME_SLOTS.map((time) => {
                      const isSelected = selectedSlots.some(
                        (slot) =>
                          slot.panelId === panel.id &&
                          slot.date === dateString &&
                          slot.time === time,
                      );
                      return (
                        <Button
                          type="button"
                          key={time}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleSlot(panel.id, dateString, time)}
                          className="min-w-0 px-2 text-xs"
                        >
                          <Clock3 className="h-3 w-3" aria-hidden />
                          {time.slice(0, 5)}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </section>
            );
          })}

        {selectedSlots.length > 0 && (
          <section className="rounded-lg border border-gold/35 bg-gold/8 px-5 py-4 sm:px-6">
            <p className="text-xs font-medium uppercase text-gold-deep">Total estimado</p>
            <p className="mt-1 font-display text-3xl font-bold text-navy">
              {currencyFormatter.format(estimatedTotal)}
            </p>
            <p className="mt-1 text-xs text-ink-soft">
              {selectedSlots.length} inserções ×{" "}
              {currencyFormatter.format(SPACE_DEFAULT_SLOT_PRICE)}
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
            onClick={() => void navigate({ to: "/dashboard/campanhas/nova/pontos" })}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Voltar
          </Button>
          <Button
            type="button"
            onClick={() => quoteMutation.mutate()}
            disabled={selectedSlots.length === 0 || quoteMutation.isPending}
            className="min-h-10"
          >
            {quoteMutation.isPending ? "Gerando..." : "Gerar orçamento"}
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
