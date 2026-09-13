import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, ExternalLink, MapPin, Send, Users, WifiOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Logo } from "./Logo";
import { MediaTypeChips } from "./MediaBadges";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  publicMediaTypes,
  isWifiTemporarilyUnavailable,
  type Category,
  type NetworkPoint,
} from "@/data/network-points";
import { regionSummaries } from "@/data/df-regions";
import type { PointInsights } from "@/data/point-insights";
import { publicPointProfile } from "@/data/public-point-profile";
import { ENVIRONMENT_REFERENCE_NOTE, measuredImpactLabel } from "@/lib/planner/audience/metrics";
import { getIncomeLabel, getMetricLabel, getPointAudienceData } from "@/data/point-audience-data";
import { createPointTracker, type PointTracker } from "@/lib/analytics/client";
import { trackFunnel } from "@/lib/analytics/funnel";
import { useScrollDepth } from "@/hooks/useScrollDepth";
import type { PointContext } from "@/lib/analytics/types";
import { submitPointLead } from "@/lib/leads/point-lead";

/** "85000" → "85 mil"; valores abaixo de 1000 aparecem por extenso. Usado em indicadores complementares reais (point-insights.ts). */
function formatAudience(value: number) {
  return value >= 1000 ? `${Math.round(value / 1000)} mil` : value.toLocaleString("pt-BR");
}

/** Número completo com separador de milhar pt-BR — ex.: 2167660 → "2.167.660". Usado para métricas reais (pointAudienceData), que precisam do valor exato auditado/pesquisado, não uma abreviação. */
function formatMetricValue(value: number) {
  return value.toLocaleString("pt-BR");
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

function regionForPoint(pointName: string): string | undefined {
  return regionSummaries.find((r) => r.pointNames.includes(pointName))?.region;
}

const pointLeadSchema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome."),
  empresa: z.string().trim().optional(),
  contato: z.string().trim().min(5, "Informe um WhatsApp ou e-mail para retorno."),
  campanha: z.string().trim().optional(),
});

type PointLeadFormValues = z.infer<typeof pointLeadSchema>;

const fieldClass =
  "bg-white/5 border-white/15 text-off-white placeholder:text-off-white/40 focus-visible:ring-gold";

/** Card de indicador principal — fundo navy sólido, borda sutil, sem glow/gradiente/ícone. */
function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="h-full rounded-2xl border border-white/10 bg-navy-soft px-6 py-7 sm:px-7 sm:py-8">
      <div className="font-display text-4xl font-bold leading-none tracking-tight text-white sm:text-5xl">
        {value}
      </div>
      <div className="mt-3 font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-off-white/50">
        {label}
      </div>
    </div>
  );
}

function AgeBar({ label, percent }: { label: string; percent: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-14 shrink-0 font-mono text-xs text-off-white/60">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-navy-soft/70">
        <div className="h-full rounded-full bg-gold" style={{ width: `${percent}%` }} />
      </div>
      <span className="w-10 shrink-0 text-right font-mono text-xs text-off-white/70">
        {percent}%
      </span>
    </div>
  );
}

function GenderBar({ femalePercent, malePercent }: { femalePercent: number; malePercent: number }) {
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full ring-1 ring-white/10">
        <div className="bg-pink-400" style={{ width: `${femalePercent}%` }} />
        <div className="bg-blue-400" style={{ width: `${malePercent}%` }} />
      </div>
      <div className="mt-2.5 flex items-center justify-between font-mono text-xs">
        <span className="flex items-center gap-1.5 text-off-white/70">
          <span className="h-2 w-2 rounded-full bg-pink-400" /> Mulheres {femalePercent}%
        </span>
        <span className="flex items-center gap-1.5 text-off-white/70">
          <span className="h-2 w-2 rounded-full bg-blue-400" /> Homens {malePercent}%
        </span>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-off-white/45">
      {children}
    </div>
  );
}

function MapPreview({ point, tracker }: { point: NetworkPoint; tracker: PointTracker }) {
  if (!point.location) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-5 text-sm text-off-white/45">
        <MapPin className="h-5 w-5 shrink-0 text-off-white/30" strokeWidth={1.6} />
        Localização no mapa ainda não disponível.
      </div>
    );
  }
  const { lat, lng, mapsUrl } = point.location;
  const embedSrc = `https://www.google.com/maps?q=${lat},${lng}&z=16&output=embed`;
  return (
    <div className="overflow-hidden rounded-2xl ring-1 ring-white/10">
      <div className="relative h-44 w-full bg-white/5 sm:h-52">
        <iframe
          src={embedSrc}
          title={`Mapa — ${point.nome}`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => tracker.track("point_maps_click")}
        className="flex cursor-pointer items-center justify-between gap-2 bg-white/[0.05] px-4 py-3 font-mono text-xs uppercase tracking-wider text-off-white/75 transition-colors hover:bg-white/[0.09] hover:text-gold"
      >
        Ver no Google Maps
        <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
      </a>
    </div>
  );
}

function PointLeadForm({
  slug,
  pointName,
  utm,
}: {
  slug: string;
  pointName: string;
  utm?: PointContext["utm"];
}) {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const form = useForm<PointLeadFormValues>({
    resolver: zodResolver(pointLeadSchema),
    defaultValues: { nome: "", empresa: "", contato: "", campanha: "" },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: PointLeadFormValues) {
    setStatus("idle");
    setErrorMessage(null);

    try {
      await submitPointLead({
        data: {
          ...values,
          pointName,
          pointSlug: slug,
          pageUrl: typeof window !== "undefined" ? window.location.href : `/ponto/${slug}`,
          submittedAt: new Date().toISOString(),
          utm_source: utm?.utm_source,
          utm_medium: utm?.utm_medium,
          utm_campaign: utm?.utm_campaign,
          utm_content: utm?.utm_content,
        },
      });
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
      setErrorMessage(
        "Não conseguimos enviar agora. Seus dados foram mantidos; tente novamente em instantes.",
      );
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="mt-7 grid gap-4 text-left">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-mono text-[11px] uppercase tracking-wider text-off-white/80">
                Nome *
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Seu nome"
                  className={fieldClass}
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-red" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="empresa"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-mono text-[11px] uppercase tracking-wider text-off-white/80">
                Empresa
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Nome da empresa"
                  className={fieldClass}
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-red" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contato"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-mono text-[11px] uppercase tracking-wider text-off-white/80">
                WhatsApp ou e-mail para retorno *
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="(61) 90000-0000 ou voce@empresa.com"
                  className={fieldClass}
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-red" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="campanha"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-mono text-[11px] uppercase tracking-wider text-off-white/80">
                Sobre a campanha <span className="normal-case text-off-white/40">(opcional)</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Período, objetivo ou formato de interesse"
                  className={`${fieldClass} min-h-[96px]`}
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-red" />
            </FormItem>
          )}
        />

        {status === "success" && (
          <div className="flex items-start gap-2 rounded-xl border border-teal/30 bg-teal/10 px-4 py-3 text-sm text-off-white/80">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" strokeWidth={2} />
            Interesse enviado. A equipe MOBTV entrará em contato pelo canal informado.
          </div>
        )}
        {status === "error" && errorMessage && (
          <div className="rounded-xl border border-red/30 bg-red/10 px-4 py-3 text-sm text-off-white/80">
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary inline-flex w-full items-center justify-center gap-2 text-center disabled:pointer-events-none disabled:opacity-60"
        >
          <Send className="h-4 w-4" strokeWidth={2} />
          {isSubmitting ? "Enviando..." : "Enviar interesse"}
        </button>
      </form>
    </Form>
  );
}

export function PointProfile({
  slug,
  point,
  category,
  insights,
  assetId,
  source,
  utm,
}: {
  slug: string;
  point: NetworkPoint;
  category: Category;
  insights: PointInsights | undefined;
  assetId?: string;
  source?: string;
  utm?: PointContext["utm"];
}) {
  const trackerRef = useRef<PointTracker | null>(null);
  if (!trackerRef.current) {
    trackerRef.current = createPointTracker({
      pointId: slug,
      pointName: point.nome,
      categoryKey: category.key,
      assetId,
      source,
      utm,
    });
  }
  const tracker = trackerRef.current;

  const hasFiredView = useRef(false);
  if (!hasFiredView.current && typeof window !== "undefined") {
    hasFiredView.current = true;
    tracker.track("point_profile_view");
  }

  useScrollDepth((percent) => tracker.track("point_scroll_depth", { scrollDepthPercent: percent }));

  // Saída do perfil de ponto para o site institucional — mantém o evento de
  // ponto legado e registra o passo `site_continue` do funil da jornada.
  const handleSiteContinue = () => {
    tracker.track("point_site_click");
    trackFunnel("site_continue", {
      pointSlug: slug,
      pointName: point.nome,
      categoryKey: category.key,
    });
  };

  const region = regionForPoint(point.nome);
  const mediaTypes = publicMediaTypes(point);
  const wifiUnavailable = isWifiTemporarilyUnavailable(point);
  const photo = point.images?.[0];
  const audienceData = getPointAudienceData(slug);
  const published = publicPointProfile(audienceData, insights);
  const audience = published.audience;

  // Card principal: impactos Datavision/Mídia Kit > passageiros > primeira
  // métrica disponível (ver getPrimaryMetric) — nunca rotulado genericamente
  // como "Pessoas/mês" quando o dado real é outra coisa (impactos,
  // atendimentos, procedimentos, consultas, estimativa de visitantes).
  const primaryMetric = published.primaryMetric;
  const monthlyAudienceValue = primaryMetric
    ? formatMetricValue(primaryMetric.value)
    : published.monthlyAudience != null
      ? formatAudience(published.monthlyAudience)
      : "—";
  const monthlyAudienceLabel =
    primaryMetric?.type === "audited_impacts"
      ? measuredImpactLabel(primaryMetric.measurementScope)
      : primaryMetric
        ? getMetricLabel(primaryMetric.type)
        : "Audiência de referência";

  // Card de renda: tipo (domiciliar/familiar/per capita) vem do dado real —
  // nunca rotulado como "familiar" quando o dado é domiciliar ou per capita.
  const averageFamilyIncomeValue = published.income
    ? formatCurrency(published.income.value)
    : published.averageFamilyIncome != null
      ? formatCurrency(published.averageFamilyIncome)
      : "R$ —";
  const averageIncomeLabel = published.income
    ? getIncomeLabel(published.income.type)
    : "Renda média familiar";

  const hasAgeBrackets = audience?.ageBrackets && audience.ageBrackets.length > 0;
  const hasGender = audience?.femalePercent != null && audience?.malePercent != null;
  const hasAudienceSection = hasAgeBrackets || hasGender;

  return (
    <div className="flex min-h-screen flex-col bg-navy text-off-white">
      {/* Barra superior mínima — só a marca, sem navegação institucional. */}
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <Link to="/" onClick={() => handleSiteContinue()}>
          <Logo variant="light" className="h-7" />
        </Link>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-off-white/40">
          MOBTV Insights
        </span>
      </header>

      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden px-6 pb-10 pt-10 sm:pt-14">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background:
                "radial-gradient(120% 100% at 15% 0%, color-mix(in oklab, var(--teal) 16%, transparent), transparent 55%)",
            }}
          />
          <div className="relative mx-auto max-w-3xl">
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-gold">
              / Perfil do ponto
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl">
              {point.nome}
            </h1>
            <p className="mt-2 font-mono text-sm text-off-white/55">
              {category.label}
              {region ? ` · ${region} — DF` : " — DF"}
            </p>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-off-white/75">
              Conheça o público e o potencial de mídia deste ponto.
            </p>

            {photo && (
              <div className="mt-8 overflow-hidden rounded-2xl ring-1 ring-white/10">
                <img
                  src={photo}
                  alt={point.nome}
                  className="aspect-[16/10] w-full object-cover"
                  style={{ objectPosition: "center 42%" }}
                />
              </div>
            )}
          </div>
        </section>

        {/* PRINCIPAIS INDICADORES — sempre 2 cards; card sem dado mostra "—", nunca some. */}
        <section className="px-6 pb-4 pt-8">
          <div className="mx-auto max-w-3xl">
            <SectionLabel>Principais indicadores</SectionLabel>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <StatCard value={monthlyAudienceValue} label={monthlyAudienceLabel} />
              <StatCard value={averageFamilyIncomeValue} label={averageIncomeLabel} />
            </div>
            {primaryMetric?.type === "audited_impacts" && (
              <p className="mt-4 text-xs leading-relaxed text-off-white/50">
                Medido e auditado · {primaryMetric.source} · {primaryMetric.period}
                {primaryMetric.measurementScope === "environment_reference" &&
                  ` — ${ENVIRONMENT_REFERENCE_NOTE}`}
              </p>
            )}
          </div>
        </section>

        {/* PERFIL DE AUDIÊNCIA */}
        {hasAudienceSection && (
          <section className="px-6 pb-8 pt-2">
            <div className="mx-auto max-w-3xl rounded-2xl bg-white/[0.03] p-6 ring-1 ring-white/10 sm:p-8">
              <div className="mb-6 flex items-center gap-2.5">
                <Users className="h-4 w-4 text-gold-deep" strokeWidth={1.8} />
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-off-white/45">
                  Perfil de audiência
                </span>
              </div>

              {hasAgeBrackets && (
                <div className="flex flex-col gap-3">
                  <div className="font-display text-sm font-semibold text-white/90">
                    Faixa etária
                  </div>
                  {audience!.ageBrackets!.map((b) => (
                    <AgeBar key={b.label} label={b.label} percent={b.percent} />
                  ))}
                </div>
              )}

              {hasGender && (
                <div className={hasAgeBrackets ? "mt-7" : ""}>
                  <div className="mb-3 font-display text-sm font-semibold text-white/90">
                    Gênero
                  </div>
                  <GenderBar
                    femalePercent={audience!.femalePercent!}
                    malePercent={audience!.malePercent!}
                  />
                </div>
              )}
            </div>
          </section>
        )}

        {/* MÍDIA DISPONÍVEL — dado real do networkPoints, nunca inventado aqui.
            WiFi só entra como disponível quando a campanha está ativa
            (publicMediaTypes); infra temporariamente indisponível vira nota. */}
        {(mediaTypes.length > 0 || wifiUnavailable) && (
          <section className="px-6 py-8">
            <div className="mx-auto max-w-3xl">
              <SectionLabel>Mídia disponível</SectionLabel>
              {mediaTypes.length > 0 && <MediaTypeChips types={mediaTypes} />}
              {wifiUnavailable && (
                <p
                  className={`flex items-center gap-2 text-sm text-off-white/55 ${
                    mediaTypes.length > 0 ? "mt-3" : ""
                  }`}
                >
                  <WifiOff className="h-4 w-4 shrink-0 text-off-white/40" strokeWidth={1.8} />
                  WiFi indisponível no momento para novas campanhas.
                </p>
              )}
            </div>
          </section>
        )}

        {/* LOCALIZAÇÃO */}
        <section className="px-6 py-8">
          <div className="mx-auto max-w-3xl">
            <div className="mb-4 flex items-center gap-2.5">
              <MapPin className="h-4 w-4 text-gold-deep" strokeWidth={1.8} />
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-off-white/45">
                Localização
              </span>
            </div>
            <MapPreview point={point} tracker={tracker} />
          </div>
        </section>

        {/* CTA COMERCIAL — sem preço, sem orçamento, sem R$. */}
        <section className="px-6 py-14">
          <div className="mx-auto max-w-3xl rounded-3xl bg-gradient-to-br from-navy-soft to-navy p-8 text-center ring-1 ring-gold/20 sm:p-12">
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-gold">
              / Anuncie aqui
            </div>
            <h2 className="mt-3 font-display text-2xl font-bold leading-tight sm:text-3xl">
              Sua marca pode estar aqui.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-off-white/70 sm:text-base">
              Fale com a MOBTV e receba uma proposta personalizada para este ponto.
            </p>
            <div className="mx-auto max-w-md">
              <PointLeadForm slug={slug} pointName={point.nome} utm={utm} />
              <Link
                to="/"
                onClick={() => handleSiteContinue()}
                className="mt-3 inline-flex w-full cursor-pointer items-center justify-center rounded-lg border border-gold/40 px-6 py-3 text-center font-semibold text-gold transition-colors hover:border-gold hover:bg-gold/10"
              >
                Conhecer a MOBTV →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 px-6 py-6 text-center">
        <p className="font-mono text-[11px] text-off-white/35">
          © 2026 MOBTV. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
