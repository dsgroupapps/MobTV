import assert from "node:assert/strict";
import test from "node:test";

import type { PointIntelligence } from "./types.ts";
import {
  formatCompact,
  getPointIntelligence,
  rollupCampaignAudience,
  simulateCampaign,
} from "./index.ts";
import {
  estimateHospitalScreenImpressions,
  getHospitalScreenPointIntelligence,
  HOSPITAL_SCREEN_MODEL,
  HOSPITAL_SCREEN_MULTIPLIER,
} from "./hospital-screen.ts";
import { getUpaScreenPointIntelligence } from "./screen.ts";
import { getPointAudienceData } from "../../../data/point-audience-data.ts";

/**
 * Dados oficiais 2025 (InfoSaúde-DF/SIA-MS), competência ano completo — os
 * mesmos valores anuais gravados em `point-audience-data.ts`. O mensal é
 * sempre `Math.round(anual / 12)`, calculado aqui do mesmo jeito que o
 * código faz, nunca copiado de um arredondamento manual.
 */
const OFFICIAL_2025: Record<
  string,
  { emergencyAnnual: number; consultationsAnnual: number; examsAnnual: number }
> = {
  "hospital-regional-de-taguatinga": {
    emergencyAnnual: 188_106,
    consultationsAnnual: 260_449,
    examsAnnual: 94_761,
  },
  "hospital-regional-de-ceilandia": {
    emergencyAnnual: 68_259,
    consultationsAnnual: 246_758,
    examsAnnual: 87_589,
  },
  "hospital-regional-do-gama": {
    emergencyAnnual: 248_615,
    consultationsAnnual: 280_027,
    examsAnnual: 117_839,
  },
  "hospital-regional-de-santa-maria": {
    emergencyAnnual: 253_037,
    consultationsAnnual: 364_745,
    examsAnnual: 179_597,
  },
};

/** Valores antigos (dados pré-2025, agora descartados) — nenhum hospital pode bater com eles. */
const OLD_SUPERSEDED_MONTHLY: Record<string, number> = {
  "hospital-regional-de-taguatinga": 12_746,
  "hospital-regional-de-ceilandia": 7_886,
  "hospital-regional-do-gama": 12_500,
  "hospital-regional-de-santa-maria": 5_000,
};

function monthlyOf(annual: number): number {
  return Math.round(annual / 12);
}

function hospitalOf(slug: string): PointIntelligence {
  const intel = getHospitalScreenPointIntelligence(slug);
  assert.ok(intel, `esperava inteligência de Tela/hospital para "${slug}"`);
  return intel;
}

function entryOf(slug: string) {
  return { slug, name: slug, intelligence: hospitalOf(slug) };
}

test("modelo: 1,25 × 0,80 × 2,0 = 2,0 (mesma conclusão da rodada anterior, reconfirmada)", () => {
  assert.equal(HOSPITAL_SCREEN_MODEL.presenceFactor, 1.25);
  assert.equal(HOSPITAL_SCREEN_MODEL.exposureFactor, 0.8);
  assert.equal(HOSPITAL_SCREEN_MODEL.effectiveExposureFrequency, 2.0);
  assert.equal(HOSPITAL_SCREEN_MULTIPLIER, 2.0);
});

test("HRT usa os dados do HRT (não confunde com HRG/HRC/HRSM)", () => {
  const { emergencyAnnual, consultationsAnnual } = OFFICIAL_2025["hospital-regional-de-taguatinga"];
  const intel = hospitalOf("hospital-regional-de-taguatinga");
  assert.equal(intel.baseMetric?.annualValue, consultationsAnnual); // consultas > emergências
  assert.equal(intel.baseMetric?.value, monthlyOf(consultationsAnnual));
  assert.notEqual(intel.baseMetric?.value, monthlyOf(emergencyAnnual));
});

test("HRC usa os dados do HRC", () => {
  const { consultationsAnnual } = OFFICIAL_2025["hospital-regional-de-ceilandia"];
  const intel = hospitalOf("hospital-regional-de-ceilandia");
  assert.equal(intel.baseMetric?.annualValue, consultationsAnnual);
  assert.equal(intel.baseMetric?.value, monthlyOf(consultationsAnnual));
});

test("HRG usa os dados do HRG", () => {
  const { consultationsAnnual } = OFFICIAL_2025["hospital-regional-do-gama"];
  const intel = hospitalOf("hospital-regional-do-gama");
  assert.equal(intel.baseMetric?.annualValue, consultationsAnnual);
  assert.equal(intel.baseMetric?.value, monthlyOf(consultationsAnnual));
});

test("HRSM usa os dados do HRSM", () => {
  const { consultationsAnnual } = OFFICIAL_2025["hospital-regional-de-santa-maria"];
  const intel = hospitalOf("hospital-regional-de-santa-maria");
  assert.equal(intel.baseMetric?.annualValue, consultationsAnnual);
  assert.equal(intel.baseMetric?.value, monthlyOf(consultationsAnnual));
});

test("nenhum hospital recebe dados de outro slug", () => {
  const values = Object.keys(OFFICIAL_2025).map((slug) => hospitalOf(slug).baseMetric?.annualValue);
  assert.equal(new Set(values).size, 4, "os 4 hospitais devem ter valores-base distintos");
});

test("valores anuais corretos (source of truth) para os 4 hospitais", () => {
  for (const [slug, official] of Object.entries(OFFICIAL_2025)) {
    const data = getPointAudienceData(slug);
    assert.ok(data, slug);
    const emergency = data.metrics.find((m) => m.type === "attendances");
    const consultations = data.metrics.find((m) => m.type === "outpatient_consultations");
    const exams = data.metrics.find((m) => m.type === "procedures");
    assert.equal(emergency?.annualValue, official.emergencyAnnual, `${slug}: emergências/ano`);
    assert.equal(
      consultations?.annualValue,
      official.consultationsAnnual,
      `${slug}: consultas/ano`,
    );
    assert.equal(exams?.annualValue, official.examsAnnual, `${slug}: exames/ano`);
    // sourceQuality A / estimated false: dado oficial observado, não estimativa
    assert.equal(emergency?.sourceQuality, "A");
    assert.equal(emergency?.estimated, false);
    assert.equal(consultations?.sourceQuality, "A");
    assert.equal(consultations?.estimated, false);
  }
});

test("valores mensais são derivados programaticamente (Math.round(anual / 12))", () => {
  for (const [slug, official] of Object.entries(OFFICIAL_2025)) {
    const data = getPointAudienceData(slug);
    const emergency = data?.metrics.find((m) => m.type === "attendances");
    const consultations = data?.metrics.find((m) => m.type === "outpatient_consultations");
    assert.equal(emergency?.value, monthlyOf(official.emergencyAnnual));
    assert.equal(consultations?.value, monthlyOf(official.consultationsAnnual));
  }
});

test("exames (procedures) NÃO são tratados como pessoas nem usados como base de circulação", () => {
  for (const slug of Object.keys(OFFICIAL_2025)) {
    const intel = hospitalOf(slug);
    // o tipo escolhido como base nunca é `procedures` (exames) — só attendances/outpatient_consultations
    assert.notEqual(intel.baseMetric?.metricType, "procedures");
  }
});

test("produção ambulatorial total não é tratada como pessoas (não é uma métrica ativa do modelo)", () => {
  // Só existe como número no `notes` do HRT (contexto de intensidade) — não
  // como PointMetric, então não pode acidentalmente entrar no cálculo.
  const data = getPointAudienceData("hospital-regional-de-taguatinga");
  const types = data?.metrics.map((m) => m.type) ?? [];
  assert.ok(!types.includes("estimated_visitors" as never));
  assert.equal(data?.metrics.length, 3); // attendances + outpatient_consultations + procedures, nada além
});

test("consultas + emergências NÃO são simplesmente somadas — usa o maior, nunca a soma", () => {
  for (const [slug, official] of Object.entries(OFFICIAL_2025)) {
    const intel = hospitalOf(slug);
    const emergencyMonthly = monthlyOf(official.emergencyAnnual);
    const consultationsMonthly = monthlyOf(official.consultationsAnnual);
    const naiveSum = emergencyMonthly + consultationsMonthly;
    assert.equal(intel.baseMetric?.value, Math.max(emergencyMonthly, consultationsMonthly));
    assert.notEqual(intel.baseMetric?.value, naiveSum);
    assert.ok(intel.baseMetric?.caveat?.includes("sobreposição"));
  }
});

test("metodologia/fórmula é aplicada corretamente (impacto = base × 2,0, calculado, não hardcoded)", () => {
  for (const [slug, official] of Object.entries(OFFICIAL_2025)) {
    const intel = hospitalOf(slug);
    const base = Math.max(
      monthlyOf(official.emergencyAnnual),
      monthlyOf(official.consultationsAnnual),
    );
    assert.equal(intel.monthly?.value, estimateHospitalScreenImpressions(base));
    assert.equal(intel.monthly?.value, base * 2);
    assert.equal(intel.monthly?.metricType, "modeled_impressions");
    assert.equal(intel.monthly?.tier, "derived"); // modeledTier(measured) = derived
    assert.equal(intel.baseMetric?.tier, "measured"); // dado oficial, não é a estimativa em si
  }
});

test("checks de impacto mensal (2025): HRT 43.408 · HRC 41.126 · HRG 46.672 · HRSM 60.790", () => {
  assert.equal(hospitalOf("hospital-regional-de-taguatinga").monthly?.value, 43_408);
  assert.equal(hospitalOf("hospital-regional-de-ceilandia").monthly?.value, 41_126);
  assert.equal(hospitalOf("hospital-regional-do-gama").monthly?.value, 46_672);
  assert.equal(hospitalOf("hospital-regional-de-santa-maria").monthly?.value, 60_790);
});

test("nenhum hospital ainda usa os valores antigos (pré-2025) superados", () => {
  for (const [slug, oldValue] of Object.entries(OLD_SUPERSEDED_MONTHLY)) {
    const intel = hospitalOf(slug);
    assert.notEqual(intel.baseMetric?.value, oldValue);
    assert.notEqual(intel.monthly?.value, oldValue);
  }
});

test("hierarquia: impacto medido (audited_impacts) venceria a base hospitalar se existisse", () => {
  // Nenhum hospital do catálogo tem Datavision hoje — validado sinteticamente
  // que o caminho `measured` tem prioridade sobre `emergency`/`consultations`.
  for (const slug of Object.keys(OFFICIAL_2025)) {
    assert.equal(hospitalOf(slug).monthly?.metricType, "modeled_impressions");
  }
});

test("ponto que não é hospital / sem Tela / inexistente → null", () => {
  assert.equal(getHospitalScreenPointIntelligence("upa-gama"), null);
  assert.equal(getHospitalScreenPointIntelligence("terminal-setor-o"), null);
  assert.equal(getHospitalScreenPointIntelligence("hospital-regional-de-sobradinho"), null); // sem Tela
  assert.equal(getHospitalScreenPointIntelligence("nao-existe-xyz"), null);
});

test("troca de ponto/serviço remove o contexto de hospital", () => {
  const slug = "hospital-regional-do-gama";
  assert.ok(getPointIntelligence(slug, ["screen"]));
  assert.equal(getPointIntelligence(slug, ["wifi"]), null);
  assert.equal(getPointIntelligence(slug, []), null);
  assert.equal(getPointIntelligence(slug, ["led"]), null); // hospital não tem LED
});

test("seleção múltipla: hospitais agregam num único grupo modelado compatível", () => {
  const rollup = rollupCampaignAudience([
    entryOf("hospital-regional-do-gama"), // 46.672
    entryOf("hospital-regional-de-ceilandia"), // 41.126
  ]);
  assert.equal(rollup.metricGroups.length, 1);
  assert.equal(rollup.metricGroups[0].metricType, "modeled_impressions");
  assert.equal(rollup.metricGroups[0].total, 46_672 + 41_126);
});

test("duração da campanha recalcula o potencial do período", () => {
  const rollup = rollupCampaignAudience([entryOf("hospital-regional-do-gama")]);
  const r15 = simulateCampaign(rollup, { days: 15, insertionsPerDay: 120 });
  const group = r15.potentialGroups.find((g) => g.metricType === "modeled_impressions");
  assert.equal(group?.monthly, 46_672);
  assert.equal(group?.windowPotential, Math.round(46_672 * (15 / 30)));
});

test("inserções não inflam impactos (sem SOV, campaignImpacts = null)", () => {
  const rollup = rollupCampaignAudience([entryOf("hospital-regional-do-gama")]);
  const few = simulateCampaign(rollup, { days: 15, insertionsPerDay: 10 });
  const many = simulateCampaign(rollup, { days: 15, insertionsPerDay: 900 });
  assert.deepEqual(
    few.potentialGroups.map((g) => g.windowPotential),
    many.potentialGroups.map((g) => g.windowPotential),
  );
  assert.equal(many.campaignImpacts, null);
  assert.ok(many.missingVariable);
});

test("dados ausentes não quebram a UI", () => {
  const bare: PointIntelligence = {
    slug: "hospital-sem-demografia",
    mediaType: "screen",
    researchCategory: "Hospital",
    environmentLabel: "Hospital",
    monthly: {
      value: 10_000,
      metricType: "modeled_impressions",
      label: "impactos potenciais/mês",
      noun: "impactos potenciais",
      source: "teste",
      tier: "derived",
      estimated: true,
    },
  };
  const rollup = rollupCampaignAudience([
    { slug: "hospital-sem-demografia", name: "Hospital X", intelligence: bare },
  ]);
  assert.equal(rollup.averageAge, undefined);
  assert.equal(rollup.gender, undefined);
  assert.equal(rollup.income, undefined);
  const result = simulateCampaign(rollup, { days: 10, insertionsPerDay: 10 });
  assert.equal(result.potentialGroups[0]?.monthly, 10_000);
});

test("source/período/tier são preservados por hospital", () => {
  const gama = hospitalOf("hospital-regional-do-gama");
  assert.match(gama.baseMetric?.source ?? "", /InfoSaúde-DF|SIA\/MS/);
  assert.equal(gama.baseMetric?.period, "ano completo 2025");
  assert.match(gama.monthly?.source ?? "", /Estimativa MOBTV/);
});

test("seleção mista: hospital + UPA agregam no mesmo grupo modelado (mesma metodologia de tipo)", () => {
  const upa = getUpaScreenPointIntelligence("upa-gama");
  assert.ok(upa);
  const rollup = rollupCampaignAudience([
    entryOf("hospital-regional-do-gama"),
    { slug: "upa-gama", name: "UPA Gama", intelligence: upa },
  ]);
  assert.equal(rollup.metricGroups.length, 1);
  assert.equal(rollup.metricGroups[0].metricType, "modeled_impressions");
  assert.equal(rollup.impactPotentialMixed, false);
});

test("seleção mista: hospital + Datavision marca impactPotentialMixed/combinesMeasuredAndModeled", () => {
  const led = getPointIntelligence("estacao-central-plano-piloto", ["led"]);
  assert.ok(led);
  const rollup = rollupCampaignAudience([
    entryOf("hospital-regional-do-gama"),
    { slug: "estacao-central-plano-piloto", name: "Central", intelligence: led },
  ]);
  assert.equal(rollup.metricGroups.length, 2);
  assert.equal(rollup.impactPotentialMixed, true);
  assert.equal(rollup.impactPotentialTotal, 46_672 + 2_167_660);

  const result = simulateCampaign(rollup, { days: 30, insertionsPerDay: 100 });
  assert.equal(result.combinesMeasuredAndModeled, true);
  assert.equal(result.combinedImpactWindow, 46_672 + 2_167_660);
});

test("formatCompact do destaque hospitalar", () => {
  assert.equal(formatCompact(46_672).replace(/\s/gu, " "), "47 mil");
});
