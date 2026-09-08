import {
  clampSimInput,
  formatCompact,
  formatCount,
  formatCurrency,
  simulateCampaign,
  type CampaignAudienceRollup,
  type CampaignSimInput,
} from "@/lib/planner/audience";

/**
 * Audiência agregada da seleção e potencial dos pontos no período escolhido.
 * A configuração comercial vive em CampaignConfiguration, mesmo sem audiência.
 *
 * Regras respeitadas aqui:
 *  - métricas de tipos diferentes NÃO são somadas — cada grupo aparece sozinho
 *    (impactos auditados x impactos potenciais modelados x fluxo x procedimentos);
 *  - não há linha de "impactos estimados da campanha" enquanto a metodologia
 *    não suportar o cálculo (ver `missingVariable`); no lugar, um aviso do que
 *    a MOBTV calcula na proposta.
 */

const TIER_NOTE: Record<string, string> = {
  measured: "medido e auditado",
  derived: "estimativa modelada",
  estimated: "estimativa",
};

function Stat({
  value,
  label,
  hint,
  strong = false,
}: {
  value: string;
  label: string;
  hint?: string;
  strong?: boolean;
}) {
  return (
    <div>
      <div
        className={`font-display font-bold leading-none ${
          strong ? "text-3xl text-gold" : "text-2xl text-white"
        }`}
      >
        {value}
      </div>
      <div className="mt-1.5 text-sm text-white/70">{label}</div>
      {hint && <div className="mt-0.5 text-[11px] leading-snug text-white/40">{hint}</div>}
    </div>
  );
}

export function CampaignAudienceSummary({
  rollup,
  sim,
}: {
  rollup: CampaignAudienceRollup;
  sim: CampaignSimInput;
}) {
  const safeSim = clampSimInput(sim);
  const result = simulateCampaign(rollup, safeSim);
  const multi = rollup.ledPointCount > 1;
  const hasEnvironmentReference = rollup.points.some(
    (p) => p.intelligence.monthly?.measurementScope === "environment_reference",
  );
  const hasPreliminaryModel = rollup.points.some(
    (p) => p.intelligence.methodology?.modelConfidence === "preliminary",
  );
  const hasModeled = rollup.metricGroups.some((g) => g.metricType === "modeled_impressions");

  return (
    <div
      data-campaign-audience
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-7"
    >
      <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold">
        Resumo de audiência da seleção
      </div>
      <div className="mt-1 text-sm text-white/60">
        {rollup.ledPointCount} ponto{rollup.ledPointCount === 1 ? "" : "s"} com inteligência de
        audiência
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {rollup.points.map((p) => (
          <span
            key={p.slug}
            className="rounded-md bg-white/[0.06] px-2.5 py-1 text-[11px] text-white/75 ring-1 ring-white/10"
          >
            {p.name}
          </span>
        ))}
      </div>

      {hasEnvironmentReference && (
        <p className="mt-3 text-[11px] text-white/55">
          Nos BRTs, a medição Datavision de 2024 é referência do ambiente para LED e Tela, não uma
          auditoria individual do monitor. Cada ponto é contado uma única vez.
        </p>
      )}
      {hasPreliminaryModel && (
        <p className="mt-3 text-[11px] text-white/55">
          Nas UPAs e hospitais, os impactos são estimativas preliminares MOBTV sobre atividade
          assistencial oficial. Os fatores de exposição ainda estão em validação.
        </p>
      )}
      {/* Agregados — um bloco por tipo de métrica, nunca somados entre si */}
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {rollup.metricGroups.map((group) => {
          const modeled = group.metricType === "modeled_impressions";
          return (
            <Stat
              key={group.metricType}
              strong
              value={modeled ? `≈ ${formatCompact(group.total)}` : formatCount(group.total)}
              label={
                modeled
                  ? "Impactos potenciais estimados/mês"
                  : group.metricType === "audited_impacts"
                    ? hasEnvironmentReference
                      ? "Impactos mensais medidos e de referência dos pontos"
                      : "Impactos mensais medidos"
                    : group.label
              }
              hint={`${group.pointCount} ponto${group.pointCount === 1 ? "" : "s"} · ${
                TIER_NOTE[group.tier]
              }`}
            />
          );
        })}
        {rollup.metricGroups.length > 1 && !rollup.impactPotentialMixed && (
          <p className="text-[11px] leading-snug text-white/40 sm:col-span-2">
            Métricas de tipos diferentes não são somadas — cada uma é apresentada separadamente.
          </p>
        )}
        {rollup.impactPotentialMixed && rollup.impactPotentialTotal != null && (
          <div className="sm:col-span-2">
            <Stat
              strong
              value={`≈ ${formatCompact(rollup.impactPotentialTotal)}`}
              label="potencial total da seleção — impactos/mês"
              hint="combina métricas medidas (Datavision) e estimativas modeladas conforme a disponibilidade de dados de cada ponto"
            />
          </div>
        )}
      </div>

      {rollup.referenceGroups.map((group) => (
        <div key={group.metricType} className="mt-6 border-t border-white/8 pt-5">
          <Stat
            value={`≈ ${formatCount(group.total)}`}
            label={group.label}
            hint="Base parcial estimada de fluxo, sem conversão para impactos ou pessoas únicas."
          />
        </div>
      ))}

      {multi &&
        (rollup.averageAge != null || rollup.gender != null || rollup.environmentsLabel) && (
          <div className="mt-6 grid gap-5 border-t border-white/8 pt-5 sm:grid-cols-3">
            {rollup.averageAge != null && (
              <Stat
                value={`≈ ${Math.round(rollup.averageAge)} anos`}
                label="idade média (perfil predominante)"
              />
            )}
            {rollup.gender != null && (
              <Stat
                value={`${rollup.gender.femalePercent}% / ${rollup.gender.malePercent}%`}
                label="mulheres / homens (média dos pontos)"
              />
            )}
            {rollup.environmentsLabel && (
              <Stat value={rollup.environmentsLabel} label="ambientes" />
            )}
            {rollup.income != null && (
              <Stat
                value={
                  rollup.income.min === rollup.income.max
                    ? formatCurrency(rollup.income.min)
                    : `${formatCurrency(rollup.income.min)} – ${formatCurrency(rollup.income.max)}`
                }
                label={`${rollup.income.label} (faixa no entorno)`}
              />
            )}
            {rollup.income == null && rollup.incomeTypesMixed && (
              <p className="text-[11px] leading-snug text-white/40 sm:col-span-3">
                Renda: os pontos usam tipos diferentes (domiciliar / familiar / per capita) —
                exibida individualmente em cada ponto, não combinada.
              </p>
            )}
          </div>
        )}

      {/* Potencial dos pontos no período; independente do volume desejado. */}
      <div className="mt-7 border-t border-white/8 pt-6">
        {result.potentialGroups.map((group) => (
          <div key={group.metricType} className="mt-6 border-t border-white/8 pt-5">
            <div className="font-mono text-[10px] uppercase tracking-wider text-off-white/45">
              {group.label}
              {result.potentialGroups.length > 1 ? ` · ${group.pointCount} ponto(s)` : ""}
            </div>
            <div className="mt-3 grid gap-5 sm:grid-cols-3">
              <Stat
                value={formatCount(group.monthly)}
                label="potencial mensal dos pontos"
                hint={TIER_NOTE[group.tier]}
              />
              <Stat
                value={formatCount(group.dailyReference)}
                label="média diária de referência"
                hint="potencial mensal ÷ 30"
              />
              <Stat
                value={formatCount(group.windowPotential)}
                label={`potencial de exposição em ${formatCount(safeSim.days)} dias`}
                hint="potencial do ambiente na janela — não é a entrega garantida da campanha"
              />
            </div>
          </div>
        ))}

        {result.combinesMeasuredAndModeled && result.combinedImpactWindow != null && (
          <div className="mt-6 border-t border-white/8 pt-5">
            <Stat
              strong
              value={`≈ ${formatCompact(result.combinedImpactWindow)}`}
              label={`potencial total da seleção em ${formatCount(safeSim.days)} dias`}
              hint="soma o potencial medido (Datavision) e o estimado (modelado) dos pontos na janela — cada parcela mantém sua procedência acima"
            />
          </div>
        )}

        {result.campaignImpacts != null ? (
          <div className="mt-5 rounded-xl bg-gold/10 p-4 ring-1 ring-gold/30">
            <div className="font-display text-2xl font-bold text-gold">
              ≈ {formatCount(result.campaignImpacts)}
            </div>
            <div className="mt-1 text-sm text-white/70">impactos estimados da campanha</div>
          </div>
        ) : (
          result.potentialGroups.length > 0 && (
            <div className="mt-5 rounded-xl bg-white/[0.04] p-4 ring-1 ring-white/10">
              <div className="font-mono text-[10px] uppercase tracking-wider text-off-white/45">
                Impactos estimados da campanha
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-white/60">
                O potencial dos pontos no período não representa a entrega do anúncio. O volume
                desejado e sua distribuição serão avaliados pela equipe comercial; as inserções não
                multiplicam a audiência apresentada.
              </p>
            </div>
          )
        )}

        <p className="mt-4 text-[10px] leading-relaxed text-white/30">
          {hasModeled
            ? "Impactos potenciais representam oportunidades de exposição à mídia, não pessoas únicas. "
            : ""}
          Estimativas baseadas em dados históricos de audiência e nas características dos pontos
          selecionados. Os resultados reais podem variar.
        </p>
      </div>
    </div>
  );
}
