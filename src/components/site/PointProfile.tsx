import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import { MapPin, ExternalLink, Sparkles, Users, TrendingUp } from "lucide-react";
import { Logo } from "./Logo";
import { MediaTypeChips } from "./MediaBadges";
import { pointMediaTypes, type Category, type NetworkPoint } from "@/data/network-points";
import { regionSummaries } from "@/data/df-regions";
import type { PointInsights } from "@/data/point-insights";
import { createPointTracker, type PointTracker } from "@/lib/analytics/client";
import { useScrollDepth } from "@/hooks/useScrollDepth";
import type { PointContext } from "@/lib/analytics/types";

// Mesmos contatos oficiais usados em Header.tsx / Contact.tsx / Footer.tsx —
// não duplicar/inventar outro número ou e-mail aqui.
const WHATSAPP_NUMBER = "5561992590234";
const COMMERCIAL_EMAIL = "comercial@mobtv.tv.br";

function formatNumber(value: number) {
  return value.toLocaleString("pt-BR");
}

function regionForPoint(pointName: string): string | undefined {
  return regionSummaries.find((r) => r.pointNames.includes(pointName))?.region;
}

function buildWhatsAppUrl(pointName: string) {
  const text = `Olá! Vi o perfil da ${pointName} pelo QR Code da MOBTV e gostaria de saber mais sobre anunciar neste ponto.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

function buildMailtoUrl(pointName: string) {
  const subject = `Interesse em anunciar — ${pointName} (MOBTV)`;
  const body = `Olá! Vi o perfil da ${pointName} pelo QR Code da MOBTV e gostaria de saber mais sobre anunciar neste ponto.`;
  return `mailto:${COMMERCIAL_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** Aviso "dados demonstrativos" — reutilizado nos pontos onde números fictícios aparecem. */
function DemoBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-gold ring-1 ring-gold/30 ${className}`}
    >
      <Sparkles className="h-3 w-3" strokeWidth={2.2} />
      Dados demonstrativos
    </span>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/10">
      <div className="font-display text-3xl font-bold leading-none text-white sm:text-4xl">
        {value}
      </div>
      <div className="mt-2 font-mono text-[11px] uppercase tracking-wider text-off-white/55">
        {label}
      </div>
    </div>
  );
}

function AgeBar({ label, percent }: { label: string; percent: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-14 shrink-0 font-mono text-xs text-off-white/60">{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal to-gold"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="w-10 shrink-0 text-right font-mono text-xs text-off-white/70">{percent}%</span>
    </div>
  );
}

function GenderBar({ femalePercent, malePercent }: { femalePercent: number; malePercent: number }) {
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full ring-1 ring-white/10">
        <div className="bg-gold" style={{ width: `${femalePercent}%` }} />
        <div className="bg-teal" style={{ width: `${malePercent}%` }} />
      </div>
      <div className="mt-2.5 flex items-center justify-between font-mono text-xs">
        <span className="flex items-center gap-1.5 text-off-white/70">
          <span className="h-2 w-2 rounded-full bg-gold" /> Mulheres {femalePercent}%
        </span>
        <span className="flex items-center gap-1.5 text-off-white/70">
          <span className="h-2 w-2 rounded-full bg-teal" /> Homens {malePercent}%
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
        Localização no mapa em breve.
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

  const region = regionForPoint(point.nome);
  const mediaTypes = pointMediaTypes(point);
  const photo = point.images?.[0];
  const isDemo = insights?.isDemo ?? false;
  const audience = insights?.audience;
  const metrics = insights?.metrics;

  const hasHeroStats =
    metrics?.monthlyFlow != null ||
    audience?.dominantAgeRange != null ||
    audience?.femalePercent != null ||
    audience?.malePercent != null;
  const hasAgeBrackets = audience?.ageBrackets && audience.ageBrackets.length > 0;
  const hasGender = audience?.femalePercent != null && audience?.malePercent != null;
  const hasAudienceSection = hasAgeBrackets || hasGender;
  const hasFlowSection =
    metrics?.monthlyFlow != null ||
    metrics?.monthlyImpacts != null ||
    metrics?.avgDwellMinutes != null ||
    metrics?.peakHours != null;

  return (
    <div className="flex min-h-screen flex-col bg-navy text-off-white">
      {/* Barra superior mínima — só a marca, sem navegação institucional. */}
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <Link to="/" onClick={() => tracker.track("point_site_click")}>
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
            {isDemo && <DemoBadge className="mt-5" />}

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

        {/* PRINCIPAIS INDICADORES */}
        {hasHeroStats && (
          <section className="px-6 py-8">
            <div className="mx-auto max-w-3xl">
              <SectionLabel>Principais indicadores</SectionLabel>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {metrics?.monthlyFlow != null && (
                  <StatCard value={`${Math.round(metrics.monthlyFlow / 1000)} mil`} label="pessoas/mês" />
                )}
                {audience?.dominantAgeRange != null && (
                  <StatCard value={audience.dominantAgeRange} label="faixa etária predominante" />
                )}
                {audience?.femalePercent != null && (
                  <StatCard value={`${audience.femalePercent}%`} label="mulheres" />
                )}
                {audience?.malePercent != null && (
                  <StatCard value={`${audience.malePercent}%`} label="homens" />
                )}
              </div>
              {isDemo && (
                <p className="mt-4 text-xs leading-relaxed text-off-white/40">
                  Protótipo — indicadores acima são ilustrativos, para visualização do formato final.
                </p>
              )}
            </div>
          </section>
        )}

        {/* PERFIL DE AUDIÊNCIA */}
        {hasAudienceSection && (
          <section className="px-6 py-8">
            <div className="mx-auto max-w-3xl rounded-2xl bg-white/[0.03] p-6 ring-1 ring-white/10 sm:p-8">
              <div className="mb-6 flex items-center gap-2.5">
                <Users className="h-4 w-4 text-gold-deep" strokeWidth={1.8} />
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-off-white/45">
                  Perfil de audiência
                </span>
              </div>

              {hasAgeBrackets && (
                <div className="flex flex-col gap-3">
                  <div className="font-display text-sm font-semibold text-white/90">Faixa etária</div>
                  {audience!.ageBrackets!.map((b) => (
                    <AgeBar key={b.label} label={b.label} percent={b.percent} />
                  ))}
                </div>
              )}

              {hasGender && (
                <div className={hasAgeBrackets ? "mt-7" : ""}>
                  <div className="mb-3 font-display text-sm font-semibold text-white/90">Gênero</div>
                  <GenderBar femalePercent={audience!.femalePercent!} malePercent={audience!.malePercent!} />
                </div>
              )}
            </div>
          </section>
        )}

        {/* FLUXO / IMPACTO */}
        {hasFlowSection && (
          <section className="px-6 py-8">
            <div className="mx-auto max-w-3xl">
              <div className="mb-4 flex items-center gap-2.5">
                <TrendingUp className="h-4 w-4 text-gold-deep" strokeWidth={1.8} />
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-off-white/45">
                  Fluxo e impacto
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {metrics?.monthlyFlow != null && (
                  <StatCard value={`${formatNumber(metrics.monthlyFlow)} pessoas`} label="Fluxo mensal" />
                )}
                {metrics?.monthlyImpacts != null && (
                  <StatCard value={formatNumber(metrics.monthlyImpacts)} label="Impactos mensais" />
                )}
                {metrics?.avgDwellMinutes != null && (
                  <StatCard value={`${metrics.avgDwellMinutes} min`} label="Tempo médio de permanência" />
                )}
                {metrics?.peakHours != null && (
                  <StatCard value={metrics.peakHours} label="Horário de maior movimento" />
                )}
              </div>
            </div>
          </section>
        )}

        {/* MÍDIA DISPONÍVEL — dado real do networkPoints, nunca inventado aqui. */}
        {mediaTypes.length > 0 && (
          <section className="px-6 py-8">
            <div className="mx-auto max-w-3xl">
              <SectionLabel>Mídia disponível</SectionLabel>
              <MediaTypeChips types={mediaTypes} />
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
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-gold">/ Anuncie aqui</div>
            <h2 className="mt-3 font-display text-2xl font-bold leading-tight sm:text-3xl">
              Sua marca pode estar aqui.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-off-white/70 sm:text-base">
              Fale com a MOBTV e receba uma proposta personalizada para este ponto.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <a
                href={buildWhatsAppUrl(point.nome)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => tracker.track("point_whatsapp_click")}
                className="btn-primary w-full text-center"
              >
                Solicitar proposta pelo WhatsApp
              </a>
              <a
                href={buildMailtoUrl(point.nome)}
                onClick={() => tracker.track("point_email_click")}
                className="w-full cursor-pointer rounded-lg border border-gold px-6 py-3 text-center font-semibold text-gold transition-colors hover:bg-gold hover:text-navy"
              >
                Enviar e-mail
              </a>
              <Link
                to="/"
                onClick={() => tracker.track("point_site_click")}
                className="w-full cursor-pointer py-2 text-center font-mono text-sm text-off-white/55 transition-colors hover:text-gold"
              >
                Conhecer a MOBTV →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 px-6 py-6 text-center">
        <p className="font-mono text-[11px] text-off-white/35">© 2026 MOBTV. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
