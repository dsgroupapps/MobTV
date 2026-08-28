import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, Clock3, LoaderCircle, MapPin, Monitor } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminTargetUserStatsQueryOptions, createAdminCampaign } from "@/lib/admin/campaigns";
import type { AdminCampaignCreationData } from "@/lib/admin/types";
import {
  CAMPAIGN_DURATIONS,
  CAMPAIGN_PANEL_DAILY_PRICE,
  calculateCampaignTotal,
  calculateSpaceSlotPrice,
  campaignBriefSchema,
  generateLegacyTimeSlots,
  type CampaignBrief,
  type SelectedTimeSlot,
} from "@/lib/campaign/business";
import { cn } from "@/lib/utils";

const TIME_SLOTS = generateLegacyTimeSlots();
const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function AdminCampaignCreatePage({
  adminUserId,
  data,
}: {
  adminUserId: string;
  data: AdminCampaignCreationData;
}) {
  const createCampaign = useServerFn(createAdminCampaign);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const today = format(new Date(), "yyyy-MM-dd");
  const [targetUserId, setTargetUserId] = useState("");
  const [campaignType, setCampaignType] = useState<CampaignBrief["type"]>("campaign");
  const [dateStart, setDateStart] = useState(today);
  const [dateEnd, setDateEnd] = useState(today);
  const [duration, setDuration] = useState<(typeof CAMPAIGN_DURATIONS)[number]>(15);
  const [totalInsertions, setTotalInsertions] = useState("");
  const [selectedPanelIds, setSelectedPanelIds] = useState<string[]>([]);
  const [selectedSlotDate, setSelectedSlotDate] = useState(today);
  const [selectedSlots, setSelectedSlots] = useState<SelectedTimeSlot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const {
    data: targetStats,
    isLoading: loadingStats,
    error: targetStatsError,
  } = useQuery(adminTargetUserStatsQueryOptions(adminUserId, targetUserId));

  const selectedPanels = useMemo(
    () => data.panels.filter((panel) => selectedPanelIds.includes(panel.id)),
    [data.panels, selectedPanelIds],
  );
  const estimatedTotal = useMemo(() => {
    if (campaignType === "campaign") {
      return dateStart && dateEnd
        ? calculateCampaignTotal(selectedPanelIds.length, dateStart, dateEnd)
        : 0;
    }
    return selectedSlots.reduce((total, slot) => {
      const panel = data.panels.find((entry) => entry.id === slot.panelId);
      return (
        total +
        calculateSpaceSlotPrice(
          slot,
          panel?.pricingRules.filter((rule) => rule.durationSeconds === duration) ?? [],
        )
      );
    }, 0);
  }, [
    campaignType,
    data.panels,
    dateEnd,
    dateStart,
    duration,
    selectedPanelIds.length,
    selectedSlots,
  ]);

  const creationMutation = useMutation({
    mutationFn: async () => {
      const brief = campaignBriefSchema.parse({
        type: campaignType,
        date_start: dateStart,
        date_end: dateEnd,
        duration_seconds: duration,
        total_insertions:
          campaignType === "campaign" && totalInsertions !== ""
            ? Number(totalInsertions)
            : undefined,
        regions: [],
      });
      if (!targetUserId) throw new Error("Selecione um usuário.");
      if (selectedPanelIds.length === 0) throw new Error("Selecione pelo menos um painel.");
      return createCampaign({
        data: {
          targetUserId,
          quoteData: brief,
          panelIds: selectedPanelIds,
          slots: campaignType === "space" ? selectedSlots : [],
        },
      });
    },
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-reservations"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-target-user-stats"] }),
      ]);
      toast.success(`Campanha criada. Pedido #${result.orderId.slice(0, 8).toUpperCase()}.`);
      await navigate({ to: "/admin/campanhas", search: { user: targetUserId } });
    },
    onError: (mutationError) => {
      const message = mutationError instanceof Error ? mutationError.message : "Erro inesperado.";
      setError(message);
      toast.error(`Erro ao criar campanha: ${message}`);
    },
  });

  function togglePanel(panelId: string) {
    const selected = selectedPanelIds.includes(panelId);
    setSelectedPanelIds((current) =>
      selected ? current.filter((id) => id !== panelId) : [...current, panelId],
    );
    if (selected) {
      setSelectedSlots((current) => current.filter((slot) => slot.panelId !== panelId));
    }
    setError(null);
  }

  function toggleSlot(panelId: string, time: string) {
    const keyMatches = (slot: SelectedTimeSlot) =>
      slot.panelId === panelId && slot.date === selectedSlotDate && slot.time === time;
    setSelectedSlots((current) =>
      current.some(keyMatches)
        ? current.filter((slot) => !keyMatches(slot))
        : [...current, { panelId, date: selectedSlotDate, time }],
    );
    setError(null);
  }

  function toggleAllSlots(panelId: string) {
    const slotsForDate = selectedSlots.filter(
      (slot) => slot.panelId === panelId && slot.date === selectedSlotDate,
    );
    setSelectedSlots((current) => {
      const remaining = current.filter(
        (slot) => !(slot.panelId === panelId && slot.date === selectedSlotDate),
      );
      return slotsForDate.length === TIME_SLOTS.length
        ? remaining
        : [...remaining, ...TIME_SLOTS.map((time) => ({ panelId, date: selectedSlotDate, time }))];
    });
  }

  const canSubmit =
    targetUserId.length > 0 &&
    dateStart.length > 0 &&
    dateEnd >= dateStart &&
    selectedPanelIds.length > 0 &&
    (campaignType === "campaign" ? Number(totalInsertions) > 0 : selectedSlots.length > 0);

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <header>
        <p className="font-mono text-[11px] font-medium uppercase text-gold-deep">
          / Criar campanha
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-navy sm:text-4xl">
          Criar campanha para usuário
        </h1>
        <p className="mt-2 text-sm text-ink-soft sm:text-base">
          Configure e registre a contratação em nome do anunciante.
        </p>
      </header>

      {targetUserId && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["Total de campanhas", targetStats?.totalCampaigns ?? 0],
            ["Total de inserções", targetStats?.totalInsertions ?? 0],
            ["Painéis usados", targetStats?.panelStats.length ?? 0],
          ].map(([label, value]) => (
            <section key={String(label)} className="rounded-lg border border-border bg-white p-5">
              <p className="text-sm text-ink-soft">{label}</p>
              <p className="mt-2 font-display text-2xl font-bold text-navy">
                {loadingStats ? "..." : Number(value).toLocaleString("pt-BR")}
              </p>
            </section>
          ))}
        </div>
      )}

      {targetStatsError && (
        <p
          className="rounded-md border border-red/25 bg-red/8 px-4 py-3 text-sm text-red"
          role="alert"
        >
          {targetStatsError.message}
        </p>
      )}

      {data.users.length === 0 && (
        <section className="rounded-lg border border-border bg-white px-6 py-12 text-center">
          <p className="text-sm text-ink-soft">Nenhum usuário disponível para receber campanhas.</p>
        </section>
      )}

      <section className="rounded-lg border border-border bg-white p-5 sm:p-7">
        <h2 className="text-lg font-semibold text-navy">Configuração</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="admin-target-user">Usuário</Label>
            <Select value={targetUserId} onValueChange={setTargetUserId}>
              <SelectTrigger id="admin-target-user" className="h-11 bg-white">
                <SelectValue placeholder="Selecione um usuário" />
              </SelectTrigger>
              <SelectContent>
                {data.users.map((entry) => (
                  <SelectItem key={entry.id} value={entry.id}>
                    {entry.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-campaign-type">Tipo de contratação</Label>
            <Select
              value={campaignType}
              onValueChange={(value) => {
                setCampaignType(value as CampaignBrief["type"]);
                setSelectedSlots([]);
              }}
            >
              <SelectTrigger id="admin-campaign-type" className="h-11 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="campaign">Campanha</SelectItem>
                <SelectItem value="space">Espaço</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-duration">Duração do anúncio</Label>
            <Select
              value={duration.toString()}
              onValueChange={(value) =>
                setDuration(Number(value) as (typeof CAMPAIGN_DURATIONS)[number])
              }
            >
              <SelectTrigger id="admin-duration" className="h-11 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CAMPAIGN_DURATIONS.map((option) => (
                  <SelectItem key={option} value={option.toString()}>
                    {option} segundos
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-date-start">Data inicial</Label>
            <Input
              id="admin-date-start"
              type="date"
              value={dateStart}
              onChange={(event) => {
                setDateStart(event.target.value);
                if (selectedSlotDate < event.target.value) setSelectedSlotDate(event.target.value);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-date-end">Data final</Label>
            <Input
              id="admin-date-end"
              type="date"
              min={dateStart}
              value={dateEnd}
              onChange={(event) => setDateEnd(event.target.value)}
            />
          </div>
          {campaignType === "campaign" && (
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="admin-total-insertions">Total de inserções</Label>
              <Input
                id="admin-total-insertions"
                type="number"
                min={1}
                step={1}
                value={totalInsertions}
                onChange={(event) => setTotalInsertions(event.target.value)}
                placeholder="Ex: 1000"
              />
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-navy">Painéis</h2>
            <p className="mt-1 text-sm text-ink-soft">Selecione os ativos da campanha.</p>
          </div>
          <Badge variant="secondary" className="shadow-none">
            {selectedPanelIds.length} selecionados
          </Badge>
        </div>
        {data.panels.length > 0 ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.panels.map((panel) => {
              const selected = selectedPanelIds.includes(panel.id);
              return (
                <button
                  type="button"
                  key={panel.id}
                  onClick={() => togglePanel(panel.id)}
                  aria-pressed={selected}
                  className={cn(
                    "min-h-48 rounded-lg border border-border bg-white p-5 text-left transition-colors hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                    selected && "border-gold ring-1 ring-gold",
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-navy">{panel.name}</h3>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-soft">
                        <MapPin className="h-3.5 w-3.5" aria-hidden />
                        {panel.region}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "h-5 w-5 rounded border border-border bg-white",
                        selected && "border-gold bg-gold",
                      )}
                      aria-hidden
                    />
                  </div>
                  <p className="mt-4 text-sm leading-6 text-ink-soft">{panel.address}</p>
                  <p className="mt-4 font-semibold text-navy">
                    {currencyFormatter.format(CAMPAIGN_PANEL_DAILY_PRICE)}/dia
                  </p>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-border bg-white px-6 py-12 text-center">
            <Monitor className="mx-auto h-8 w-8 text-ink-soft/40" aria-hidden />
            <p className="mt-3 text-sm text-ink-soft">Nenhum painel disponível.</p>
          </div>
        )}
      </section>

      {campaignType === "space" && selectedPanels.length > 0 && (
        <section className="space-y-4">
          <div className="rounded-lg border border-border bg-white p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-navy">
              <CalendarDays className="h-5 w-5 text-gold-deep" aria-hidden />
              Horários
            </h2>
            <div className="mt-4 max-w-sm space-y-2">
              <Label htmlFor="admin-slot-date">Data dos slots</Label>
              <Input
                id="admin-slot-date"
                type="date"
                min={dateStart}
                max={dateEnd}
                value={selectedSlotDate}
                onChange={(event) => setSelectedSlotDate(event.target.value)}
              />
            </div>
          </div>
          {selectedPanels.map((panel) => {
            const selectedForDate = selectedSlots.filter(
              (slot) => slot.panelId === panel.id && slot.date === selectedSlotDate,
            );
            return (
              <section
                key={panel.id}
                className="overflow-hidden rounded-lg border border-border bg-white"
              >
                <header className="flex flex-col justify-between gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:px-6">
                  <div>
                    <h3 className="font-semibold text-navy">{panel.name}</h3>
                    <p className="mt-1 text-xs text-ink-soft">
                      {selectedSlots.filter((slot) => slot.panelId === panel.id).length} slots
                      selecionados
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => toggleAllSlots(panel.id)}
                  >
                    {selectedForDate.length === TIME_SLOTS.length
                      ? "Limpar seleção"
                      : "Selecionar todos"}
                  </Button>
                </header>
                <div className="max-h-96 overflow-y-auto p-4 sm:p-5">
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-8">
                    {TIME_SLOTS.map((time) => {
                      const selected = selectedForDate.some((slot) => slot.time === time);
                      return (
                        <Button
                          type="button"
                          key={time}
                          variant={selected ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleSlot(panel.id, time)}
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
        </section>
      )}

      <section className="rounded-lg border border-gold/35 bg-gold/8 p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-medium uppercase text-gold-deep">Total estimado</p>
            <p className="mt-1 font-display text-3xl font-bold text-navy">
              {currencyFormatter.format(estimatedTotal)}
            </p>
            <p className="mt-1 text-xs text-ink-soft">
              {campaignType === "space"
                ? `${selectedSlots.length} slots`
                : `${selectedPanelIds.length} painéis`}
            </p>
          </div>
          <Button
            type="button"
            size="lg"
            onClick={() => creationMutation.mutate()}
            disabled={!canSubmit || creationMutation.isPending}
          >
            {creationMutation.isPending ? "Criando..." : "Criar campanha"}
            {creationMutation.isPending && (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
            )}
          </Button>
        </div>
      </section>

      {error && (
        <p
          className="rounded-md border border-red/25 bg-red/8 px-4 py-3 text-sm text-red"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
