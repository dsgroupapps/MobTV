import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, LayoutGrid, Rows3 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CAMPAIGN_DURATIONS,
  campaignBriefSchema,
  type CampaignBrief,
} from "@/lib/campaign/business";
import { readCampaignBrief, writeCampaignBrief } from "@/lib/campaign/storage";
import { cn } from "@/lib/utils";
import { CampaignFlowHeader } from "./CampaignFlowHeader";

export function CampaignSetupPage() {
  const navigate = useNavigate();
  const [campaignType, setCampaignType] = useState<CampaignBrief["type"]>("campaign");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [duration, setDuration] = useState<(typeof CAMPAIGN_DURATIONS)[number]>(15);
  const [totalInsertions, setTotalInsertions] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = readCampaignBrief();
    if (!stored) return;
    setCampaignType(stored.type);
    setStartDate(new Date(`${stored.date_start}T12:00:00`));
    setEndDate(new Date(`${stored.date_end}T12:00:00`));
    setDuration(stored.duration_seconds);
    setTotalInsertions(stored.total_insertions?.toString() ?? "");
  }, []);

  function handleNext() {
    const result = campaignBriefSchema.safeParse({
      type: campaignType,
      date_start: startDate ? format(startDate, "yyyy-MM-dd") : "",
      date_end: endDate ? format(endDate, "yyyy-MM-dd") : "",
      duration_seconds: duration,
      total_insertions:
        campaignType === "campaign" && totalInsertions !== "" ? Number(totalInsertions) : undefined,
      regions: [],
    });

    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Revise os dados da campanha.");
      return;
    }

    setError(null);
    writeCampaignBrief(result.data);
    void navigate({ to: "/dashboard/campanhas/nova/pontos" });
  }

  const isFormValid =
    startDate != null &&
    endDate != null &&
    endDate >= startDate &&
    (campaignType === "space" || Number(totalInsertions) > 0);

  return (
    <div className="mx-auto max-w-4xl">
      <CampaignFlowHeader currentStep={1} />
      <div>
        <h1 className="font-display text-3xl font-bold text-navy sm:text-4xl">
          Criar nova campanha
        </h1>
        <p className="mt-2 text-sm text-ink-soft sm:text-base">
          Configure sua campanha publicitária.
        </p>
      </div>

      <section className="mt-7 rounded-lg border border-border bg-white p-5 sm:p-7">
        <div>
          <h2 className="text-lg font-semibold text-navy">Tipo de contratação</h2>
          <p className="mt-1 text-sm text-ink-soft">Escolha como deseja comprar seus espaços.</p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setCampaignType("campaign")}
            aria-pressed={campaignType === "campaign"}
            className={cn(
              "flex min-h-28 items-start gap-4 rounded-lg border border-border p-4 text-left transition-colors hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
              campaignType === "campaign" && "border-gold bg-gold/8",
            )}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-navy/8 text-navy">
              <LayoutGrid className="h-5 w-5" aria-hidden />
            </span>
            <span>
              <span className="block font-semibold text-navy">Campanha</span>
              <span className="mt-1 block text-xs leading-5 text-ink-soft">
                Defina metas e deixe o sistema distribuir.
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setCampaignType("space")}
            aria-pressed={campaignType === "space"}
            className={cn(
              "flex min-h-28 items-start gap-4 rounded-lg border border-border p-4 text-left transition-colors hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
              campaignType === "space" && "border-gold bg-gold/8",
            )}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-teal/15 text-navy">
              <Rows3 className="h-5 w-5" aria-hidden />
            </span>
            <span>
              <span className="block font-semibold text-navy">Espaço</span>
              <span className="mt-1 block text-xs leading-5 text-ink-soft">
                Selecione slots específicos manualmente.
              </span>
            </span>
          </button>
        </div>

        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Data início</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "h-11 w-full justify-start bg-white text-left font-normal",
                    !startDate && "text-ink-soft",
                  )}
                >
                  <CalendarDays className="h-4 w-4" aria-hidden />
                  {startDate ? format(startDate, "PPP", { locale: ptBR }) : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Data fim</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "h-11 w-full justify-start bg-white text-left font-normal",
                    !endDate && "text-ink-soft",
                  )}
                >
                  <CalendarDays className="h-4 w-4" aria-hidden />
                  {endDate ? format(endDate, "PPP", { locale: ptBR }) : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  disabled={(date) => (startDate ? date < startDate : false)}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="campaign-duration">Duração do anúncio</Label>
            <Select
              value={duration.toString()}
              onValueChange={(value) =>
                setDuration(Number(value) as (typeof CAMPAIGN_DURATIONS)[number])
              }
            >
              <SelectTrigger id="campaign-duration" className="h-11 bg-white">
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

          {campaignType === "campaign" && (
            <div className="space-y-2">
              <Label htmlFor="campaign-insertions">Total de inserções</Label>
              <Input
                id="campaign-insertions"
                type="number"
                min={1}
                step={1}
                placeholder="Ex: 1000"
                value={totalInsertions}
                onChange={(event) => setTotalInsertions(event.target.value)}
                className="h-11 bg-white"
              />
            </div>
          )}
        </div>

        {error && (
          <p
            className="mt-5 rounded-md border border-red/25 bg-red/8 px-4 py-3 text-sm text-red"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="mt-7 flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => void navigate({ to: "/dashboard" })}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={handleNext} disabled={!isFormValid} className="min-h-10">
            Próximo
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </section>
    </div>
  );
}
