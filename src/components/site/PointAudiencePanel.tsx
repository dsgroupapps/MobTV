import type { ReactNode } from "react";
import {
  formatCompact,
  formatCount,
  formatCurrency,
  type PointIntelligence,
} from "@/lib/planner/audience";
import { MediaTypeChips } from "./MediaBadges";

/**
 * "Audiência do ponto" — área de inteligência comercial de um ponto com
 * `Painel LED` ou `Tela`. Só mostra o que existe na fonte
 * (`point-audience-data.ts`) ou o que é derivado por modelo documentado:
 * campo ausente = seção some, nunca aparece "0" / "N/D" / valor inventado.
 */

const TIER_NOTE: Record<string, string> = {
  measured: "Medido e auditado",
  derived: "Estimativa modelada",
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
  intelligence: PointIntelligence;
  pointName: string;
  dense?: boolean;
}) {
  const {
    mediaType,
    monthly,
    baseMetric,
    dailyReference,
    methodology,
    demographics,
    behavior,
    environmentLabel,
    referenceArea,
    profileIsCategoryLevel,
  } = intelligence;

  const gender =
    demographics?.genderFemalePercent != null && demographics?.genderMalePercent != null
      ? { f: demographics.genderFemalePercent, m: demographics.genderMalePercent }
      : null;

  const hasAudienceBlock =
    demographics?.averageAge != null ||
    gender != null ||
    demographics?.income != null ||
    behavior?.dwellTime != null;

  const isModeled = monthly?.metricType === "modeled_impressions";
  const categoryTag = profileIsCategoryLevel ? " · perfil do ambiente" : "";

  return (
    <div
      data-point-audience
      data-point-name={pointName}
      data-media-type={mediaType}
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
        <MediaTypeChips types={[mediaType]} />
      </div>

      {/* Métrica principal */}
      {monthly ? (
        <div className="mt-5">
          <div
            className={`font-display font-bold leading-none text-gold ${
              dense ? "text-3xl" : "text-4xl"
            }`}
          >
            {isModeled ? `≈ ${formatCompact(monthly.value)}` : formatCount(monthly.value)}
          </div>
          <div className="mt-1.5 text-sm text-white/70">{monthly.label}</div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-off-white/40">
            {TIER_NOTE[monthly.tier]}
            {monthly.period ? ` · ${monthly.period}` : ""}
          </div>
          {isModeled && (
            <div className="mt-0.5 text-[11px] text-white/35">
              {formatCount(monthly.value)} impactos potenciais — oportunidades de exposição, não
              pessoas únicas
            </div>
          )}
        </div>
      ) : (
        <div className="mt-5 text-sm text-white/45">
          Dados de audiência detalhados em atualização.
        </div>
      )}

      {/* Base de circulação medida (só quando o destaque é derivado) */}
      {baseMetric && (
        <div className="mt-3 rounded-xl bg-white/[0.04] px-3 py-2 ring-1 ring-white/10">
          <div className="font-mono text-[10px] uppercase tracking-wider text-off-white/45">
            Base de circulação
          </div>
          <div className="mt-0.5 text-sm text-white/80">
            <span className="font-display font-semibold text-white">
              {formatCount(baseMetric.value)}
            </span>{" "}
            {baseMetric.label}
            {baseMetric.annualValue != null && (
              <span className="text-white/40"> ({formatCount(baseMetric.annualValue)}/ano)</span>
            )}
          </div>
          <div className="mt-0.5 text-[11px] text-white/35">
            {baseMetric.tier === "measured" ? "Medido" : "Fonte com ressalva"} · {baseMetric.source}
            {baseMetric.period ? ` · ${baseMetric.period}` : ""}
          </div>
          {baseMetric.caveat && (
            <div className="mt-1 text-[11px] leading-relaxed text-gold/70">{baseMetric.caveat}</div>
          )}
        </div>
      )}

      {methodology && (
        <details className="group mt-3">
          <summary className="cursor-pointer list-none font-mono text-[10px] uppercase tracking-wider text-gold/80 transition-colors hover:text-gold">
            Como calculamos?
          </summary>
          <p className="mt-2 text-[11px] leading-relaxed text-white/55">{methodology.summary}</p>
          <p className="mt-1.5 text-[10px] leading-relaxed text-white/35">{methodology.formula}</p>
        </details>
      )}

      {hasAudienceBlock && (
        <div className="mt-5 border-t border-white/8 pt-4">
          <SectionLabel>Audiência{categoryTag}</SectionLabel>
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
        {isModeled
          ? "Estimativa baseada no volume médio de atendimentos, circulação e características de permanência do ambiente. Impactos representam oportunidades de exposição e não pessoas únicas. Os resultados reais podem variar."
          : "Estimativas baseadas em dados históricos de audiência e nas características dos pontos selecionados. Os resultados reais podem variar."}
        {monthly && dailyReference
          ? ` Referência diária ≈ ${formatCount(dailyReference.value)} ${monthly.noun}/dia.`
          : ""}
      </p>
    </div>
  );
}
