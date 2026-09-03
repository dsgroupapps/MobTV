import type { ReactNode } from "react";
import { formatCount, formatCurrency, type LedPointIntelligence } from "@/lib/planner/audience";
import { MediaTypeChips } from "./MediaBadges";

/**
 * "Audiência do ponto" — área de inteligência comercial de um ponto com
 * `Painel LED`. Só mostra o que existe na fonte (`point-audience-data.ts`):
 * campo ausente = seção some, nunca aparece "0" / "N/D" / valor inventado.
 */

const TIER_NOTE: Record<LedPointIntelligence["monthly"]["tier"], string> = {
  measured: "Impacto medido e auditado",
  derived: "Estimativa derivada de dados históricos",
  estimated: "Estimativa",
};

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-off-white/45">
      {children}
    </div>
  );
}

export function PointAudiencePanel({
  intelligence,
  pointName,
  dense = false,
}: {
  intelligence: LedPointIntelligence;
  pointName: string;
  dense?: boolean;
}) {
  const { monthly, dailyReference, demographics, behavior, environmentLabel, referenceArea } =
    intelligence;

  const gender =
    demographics?.genderFemalePercent != null && demographics?.genderMalePercent != null
      ? { f: demographics.genderFemalePercent, m: demographics.genderMalePercent }
      : null;

  const hasAudienceBlock =
    demographics?.averageAge != null || gender != null || demographics?.income != null;

  return (
    <div
      data-point-audience
      data-point-name={pointName}
      className={`rounded-2xl bg-white/[0.03] ring-1 ring-white/10 ${dense ? "p-4" : "p-6"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-off-white/45">
            {environmentLabel}
            {referenceArea ? ` · ${referenceArea}` : ""}
          </div>
          <div className="mt-1 font-display text-lg font-bold leading-tight text-white">
            {pointName}
          </div>
        </div>
        <MediaTypeChips types={["led"]} />
      </div>

      {/* Métrica mensal */}
      <div className="mt-5">
        <div
          className={`font-display font-bold leading-none text-gold ${
            dense ? "text-3xl" : "text-4xl"
          }`}
        >
          {formatCount(monthly.value)}
        </div>
        <div className="mt-1.5 text-sm text-white/70">{monthly.label}</div>
        <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-off-white/40">
          {TIER_NOTE[monthly.tier]}
          {monthly.period ? ` · ${monthly.period}` : ""}
        </div>
        <div className="mt-0.5 text-[11px] text-white/35">Fonte: {monthly.source}</div>
      </div>

      {hasAudienceBlock && (
        <div className="mt-5 border-t border-white/8 pt-4">
          <SectionLabel>Audiência</SectionLabel>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {demographics?.averageAge != null && (
              <div>
                <div className="font-display text-xl font-semibold text-white">
                  ≈ {Math.round(demographics.averageAge)} anos
                </div>
                <div className="text-[11px] text-white/50">idade média</div>
              </div>
            )}
            {behavior?.dwellTime && (
              <div>
                <div className="font-display text-xl font-semibold text-white">
                  {behavior.dwellTime}
                </div>
                <div className="text-[11px] text-white/50">tempo médio de permanência</div>
              </div>
            )}
            {gender && (
              <div className="col-span-2">
                <div className="flex overflow-hidden rounded-full">
                  <span className="h-1.5 bg-gold" style={{ width: `${gender.f}%` }} aria-hidden />
                  <span className="h-1.5 flex-1 bg-teal/60" aria-hidden />
                </div>
                <div className="mt-1.5 flex justify-between text-[11px] text-white/55">
                  <span>{gender.f}% mulheres</span>
                  <span>{gender.m}% homens</span>
                </div>
              </div>
            )}
            {demographics?.income != null && (
              <div className="col-span-2">
                <div className="font-display text-lg font-semibold text-white">
                  {formatCurrency(demographics.income.value)}
                </div>
                <div className="text-[11px] text-white/50">
                  {demographics.income.label} — entorno do ponto
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {behavior?.audienceProfile && (
        <div className="mt-5 border-t border-white/8 pt-4">
          <SectionLabel>Perfil</SectionLabel>
          <p className="mt-2 text-sm leading-relaxed text-white/70">{behavior.audienceProfile}</p>
        </div>
      )}

      {behavior?.consumptionCategories && behavior.consumptionCategories.length > 0 && (
        <div className="mt-5 border-t border-white/8 pt-4">
          <SectionLabel>Interesses</SectionLabel>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {behavior.consumptionCategories.map((cat) => (
              <span
                key={cat}
                className="rounded-md bg-white/[0.06] px-2.5 py-1 text-[11px] capitalize text-white/75 ring-1 ring-white/10"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="mt-5 border-t border-white/8 pt-3 text-[10px] leading-relaxed text-white/30">
        Estimativas baseadas em dados históricos de audiência e nas características dos pontos
        selecionados. Os resultados reais podem variar. Referência diária ≈{" "}
        {formatCount(dailyReference.value)} {monthly.noun}/dia ({monthly.label} ÷ 30).
      </p>
    </div>
  );
}
