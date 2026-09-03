import assert from "node:assert/strict";
import test from "node:test";

import type { MonthlyAudienceMetric, PointIntelligence } from "./types.ts";
import {
  clampSimInput,
  formatCount,
  getPointIntelligence,
  rollupCampaignAudience,
  SIM_LIMITS,
  simulateCampaign,
} from "./index.ts";
import { estimateLedCampaignImpacts, getLedPointIntelligence } from "./led.ts";
import { metricConfidenceTier } from "./metrics.ts";
import { getPointAudienceData } from "../../../data/point-audience-data.ts";

const LED_SLUGS = [
  "estacao-central-plano-piloto",
  "estacao-shopping",
  "estacao-aguas-claras",
  "estacao-arniqueiras",
  "estacao-praca-do-relogio",
  "terminal-brt-santa-maria",
  "terminal-brt-gama",
];

type WithMonthly = PointIntelligence & {
  monthly: MonthlyAudienceMetric;
  dailyReference: { value: number };
};

function intelOf(slug: string): WithMonthly {
  const intel = getLedPointIntelligence(slug);
  assert.ok(intel, `esperava inteligência LED para "${slug}"`);
  assert.ok(intel.monthly, `esperava métrica mensal para "${slug}"`);
  assert.ok(intel.dailyReference, `esperava dailyReference para "${slug}"`);
  return intel as WithMonthly;
}

function pointEntry(slug: string) {
  return { slug, name: slug, intelligence: intelOf(slug) };
}

/** Grupo de potencial de um tipo específico dentro do resultado da simulação. */
function groupOf(result: ReturnType<typeof simulateCampaign>, metricType: string) {
  const group = result.potentialGroups.find((g) => g.metricType === metricType);
  assert.ok(group, `esperava grupo "${metricType}" na simulação`);
  return group;
}

test("1. ponto sem Painel LED (ou inexistente) não recebe inteligência LED", () => {
  // UPA tem só Monitor (Tela), com dados de audiência — mas nunca LED.
  assert.equal(getLedPointIntelligence("upa-gama"), null);
  // Ponto só-WiFi.
  assert.equal(getLedPointIntelligence("na-hora-gama"), null);
  // Slug inexistente.
  assert.equal(getLedPointIntelligence("nao-existe-xyz"), null);
});

test("2. ponto LED com dados expõe métrica, demografia e comportamento reais", () => {
  const intel = intelOf("estacao-central-plano-piloto");
  assert.equal(intel.mediaType, "led");
  assert.equal(intel.monthly.value, 2_167_660);
  assert.equal(intel.monthly.metricType, "audited_impacts");
  assert.equal(intel.monthly.label, "impactos/mês");
  assert.equal(intel.monthly.noun, "impactos");
  assert.equal(intel.monthly.tier, "measured");
  assert.equal(intel.baseMetric, undefined); // LED: `monthly` já é a medição
  assert.equal(intel.dailyReference.value, Math.round(2_167_660 / 30));
  assert.equal(intel.environmentLabel, "Metrô");

  assert.equal(intel.demographics?.averageAge, 40.5);
  assert.equal(intel.demographics?.genderFemalePercent, 54);
  assert.equal(intel.demographics?.genderMalePercent, 46);
  assert.equal(intel.demographics?.income?.label, "Renda média domiciliar");
  assert.equal(intel.demographics?.income?.type, "domiciliar");

  assert.equal(intel.behavior?.dwellTime, "6 a 15 minutos");
  assert.ok((intel.behavior?.consumptionCategories?.length ?? 0) >= 2);
  // sufixo "(categoria)" removido do texto de perfil
  assert.ok(intel.behavior?.audienceProfile && !intel.behavior.audienceProfile.includes("("));
});

test("2b. todos os 7 pontos LED do catálogo produzem inteligência com impactos auditados", () => {
  for (const slug of LED_SLUGS) {
    const intel = intelOf(slug);
    assert.equal(intel.monthly.metricType, "audited_impacts");
    assert.ok(intel.monthly.value > 0);
    assert.equal(intel.monthly.tier, "measured");
  }
});

test("3. campos ausentes não quebram o rollup nem a simulação", () => {
  const bare: PointIntelligence = {
    slug: "fake",
    mediaType: "led",
    researchCategory: "Metrô",
    environmentLabel: "Metrô",
    monthly: {
      value: 1_000_000,
      metricType: "audited_impacts",
      label: "impactos/mês",
      noun: "impactos",
      source: "teste",
      tier: "measured",
      estimated: false,
    },
    dailyReference: { value: Math.round(1_000_000 / 30) },
    // sem demographics, sem behavior
  };
  const rollup = rollupCampaignAudience([{ slug: "fake", name: "Fake", intelligence: bare }]);
  assert.equal(rollup.averageAge, undefined);
  assert.equal(rollup.gender, undefined);
  assert.equal(rollup.income, undefined);
  assert.equal(rollup.incomeTypesMixed, false);
  const result = simulateCampaign(rollup, { days: 10, insertionsPerDay: 50 });
  assert.equal(groupOf(result, "audited_impacts").monthly, 1_000_000);
  assert.equal(result.totalInsertions, 500);
});

test("4. múltiplos pontos: impactos auditados somam num único grupo compatível", () => {
  const points = ["estacao-central-plano-piloto", "estacao-shopping", "terminal-brt-gama"].map(
    pointEntry,
  );
  const rollup = rollupCampaignAudience(points);
  assert.equal(rollup.ledPointCount, 3);
  assert.equal(rollup.metricGroups.length, 1);
  const group = rollup.metricGroups[0];
  assert.equal(group.metricType, "audited_impacts");
  assert.equal(group.total, 2_167_660 + 732_239 + 2_149_173);
  assert.equal(group.pointCount, 3);
  assert.equal(rollup.environmentsLabel, "Metrô + Terminal BRT");
});

test("5. NÃO soma métricas de tipos diferentes — grupos separados", () => {
  const ledLike: PointIntelligence = {
    slug: "a",
    mediaType: "led",
    researchCategory: "Metrô",
    environmentLabel: "Metrô",
    monthly: {
      value: 500,
      metricType: "audited_impacts",
      label: "impactos/mês",
      noun: "impactos",
      source: "x",
      tier: "measured",
      estimated: false,
    },
    dailyReference: { value: 17 },
  };
  const flowLike: PointIntelligence = {
    ...ledLike,
    slug: "b",
    monthly: {
      value: 300,
      metricType: "passengers",
      label: "passageiros/mês",
      noun: "passageiros",
      source: "y",
      tier: "measured",
      estimated: false,
    },
  };
  const rollup = rollupCampaignAudience([
    { slug: "a", name: "A", intelligence: ledLike },
    { slug: "b", name: "B", intelligence: flowLike },
  ]);
  assert.equal(rollup.metricGroups.length, 2);
  const types = rollup.metricGroups.map((g) => g.metricType).sort();
  assert.deepEqual(types, ["audited_impacts", "passengers"]);
  const result = simulateCampaign(rollup, { days: 30, insertionsPerDay: 1 });
  assert.equal(result.potentialGroups.length, 2);
  assert.equal(groupOf(result, "audited_impacts").monthly, 500);
  assert.equal(groupOf(result, "passengers").monthly, 300);
});

test("6+7. duração e inserções aceitam somente valores válidos (inteiros nos limites)", () => {
  assert.deepEqual(clampSimInput({ days: 15, insertionsPerDay: 120 }), {
    days: 15,
    insertionsPerDay: 120,
  });
  // zero / negativo → mínimo
  assert.equal(clampSimInput({ days: 0, insertionsPerDay: -5 }).days, SIM_LIMITS.days.min);
  assert.equal(
    clampSimInput({ days: 0, insertionsPerDay: -5 }).insertionsPerDay,
    SIM_LIMITS.insertionsPerDay.min,
  );
  // não numérico / vazio → default
  assert.equal(clampSimInput({ days: "abc" as unknown as number }).days, SIM_LIMITS.days.default);
  // fracionário → truncado
  assert.equal(clampSimInput({ days: 15.9 }).days, 15);
  // acima do teto → teto
  assert.equal(clampSimInput({ days: 99999 }).days, SIM_LIMITS.days.max);
  assert.equal(
    clampSimInput({ insertionsPerDay: 99999 }).insertionsPerDay,
    SIM_LIMITS.insertionsPerDay.max,
  );
});

test("8. total de inserções = dias × inserções/dia", () => {
  const rollup = rollupCampaignAudience([pointEntry("estacao-central-plano-piloto")]);
  assert.equal(simulateCampaign(rollup, { days: 15, insertionsPerDay: 120 }).totalInsertions, 1800);
  assert.equal(simulateCampaign(rollup, { days: 1, insertionsPerDay: 1 }).totalInsertions, 1);
  // entrada inválida é normalizada antes da conta
  assert.equal(
    simulateCampaign(rollup, { days: -3, insertionsPerDay: 10 }).totalInsertions,
    SIM_LIMITS.days.min * 10,
  );
});

test("9. estimativa de impactos da campanha só aparece com metodologia válida", () => {
  const rollup = rollupCampaignAudience([
    pointEntry("estacao-central-plano-piloto"),
    pointEntry("terminal-brt-gama"),
  ]);
  const result = simulateCampaign(rollup, { days: 15, insertionsPerDay: 120 });
  // sem modelo de share de exibição → NÃO inventa número
  assert.equal(result.campaignImpacts, null);
  assert.ok(result.missingVariable && result.missingVariable.length > 0);
  // referências do ambiente (proporcionais ao tempo) continuam disponíveis
  const group = groupOf(result, "audited_impacts");
  assert.equal(group.monthly, 2_167_660 + 2_149_173);
  assert.equal(group.dailyReference, Math.round((2_167_660 + 2_149_173) / 30));
  assert.equal(group.windowPotential, Math.round((2_167_660 + 2_149_173) * (15 / 30)));

  // com um modelo hipotético a fórmula documentada é aplicada
  const withModel = estimateLedCampaignImpacts({
    monthlyImpacts: 3_000_000,
    days: 30,
    insertionsPerDay: 100,
    model: { loopInsertionsPerDay: 1000, methodology: "hipótese de teste" },
  });
  assert.equal(withModel.missingVariable, null);
  assert.equal(withModel.value, Math.round(3_000_000 * 1 * 0.1));
});

test("10. troca de serviço LED → outro serviço não mantém métrica LED", () => {
  const led = "estacao-central-plano-piloto";
  assert.ok(getPointIntelligence(led, ["led"]));
  // usuário troca a mídia daquele ponto para Tela/WiFi → sem inteligência LED
  // (estação de metrô não tem Tela nem é UPA → screen também é null)
  assert.equal(getPointIntelligence(led, ["screen"]), null);
  assert.equal(getPointIntelligence(led, ["wifi"]), null);
  assert.equal(getPointIntelligence(led, []), null);
});

test("renda: tipos distintos entre pontos não viram faixa; mesmo tipo vira faixa", () => {
  // Praça do Relógio usa renda FAMILIAR; Central usa DOMICILIAR → não combinar.
  const mixed = rollupCampaignAudience(
    ["estacao-central-plano-piloto", "estacao-praca-do-relogio"].map(pointEntry),
  );
  assert.equal(mixed.income, undefined);
  assert.equal(mixed.incomeTypesMixed, true);

  // Central + Shopping + BRT Gama → todos DOMICILIAR → faixa min/max.
  const same = rollupCampaignAudience(
    ["estacao-central-plano-piloto", "estacao-shopping", "terminal-brt-gama"].map(pointEntry),
  );
  assert.ok(same.income);
  assert.equal(same.income?.type, "domiciliar");
  assert.ok(same.income && same.income.min <= same.income.max);
  assert.equal(same.incomeTypesMixed, false);
});

test("metricConfidenceTier: impactos Datavision = measured; estimativa de imprensa = derived", () => {
  const central = getPointAudienceData("estacao-central-plano-piloto");
  const impacts = central?.metrics.find((m) => m.type === "audited_impacts");
  assert.ok(impacts);
  assert.equal(metricConfidenceTier(impacts), "measured");

  const feira = getPointAudienceData("feira-do-guara");
  const est = feira?.metrics.find((m) => m.type === "estimated_visitors");
  assert.ok(est);
  assert.notEqual(metricConfidenceTier(est), "measured");
});

test("formatCount usa separador pt-BR", () => {
  assert.equal(formatCount(2_167_660), "2.167.660");
});
