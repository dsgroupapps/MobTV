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
  estimateUpaScreenImpressions,
  getUpaScreenPointIntelligence,
  UPA_SCREEN_MODEL,
  UPA_SCREEN_MULTIPLIER,
} from "./screen.ts";
import { getLedPointIntelligence } from "./led.ts";

/**
 * Procedimentos/mês por slug (média jan–jun/2026) e o impacto potencial
 * esperado pelo modelo aprovado (× 2,0). É o CHECK da seção 6 do briefing —
 * os impactos NÃO são gravados, são derivados; a tabela abaixo só confere.
 */
const UPA_EXPECTED: Record<string, { procedures: number; impressions: number }> = {
  "upa-ceilandia": { procedures: 71_340, impressions: 142_680 },
  "upa-ceilandia-setor-o": { procedures: 62_165, impressions: 124_330 },
  "upa-brazlandia": { procedures: 25_732, impressions: 51_464 },
  "upa-gama": { procedures: 42_061, impressions: 84_122 },
  "upa-planaltina": { procedures: 31_497, impressions: 62_994 },
  "upa-vicente-pires": { procedures: 45_098, impressions: 90_196 },
  "upa-samambaia": { procedures: 56_565, impressions: 113_130 },
  "upa-sao-sebastiao": { procedures: 48_273, impressions: 96_546 },
  "upa-sobradinho-ii": { procedures: 54_161, impressions: 108_322 },
  "upa-riacho-fundo-ii": { procedures: 30_281, impressions: 60_562 },
  "upa-recanto-das-emas": { procedures: 62_569, impressions: 125_138 },
};

function screenOf(slug: string): PointIntelligence {
  const intel = getUpaScreenPointIntelligence(slug);
  assert.ok(intel, `esperava inteligência de Tela para "${slug}"`);
  return intel;
}

test("1. UPA + Tela mostra inteligência: impacto potencial modelado + base medida", () => {
  const intel = screenOf("upa-ceilandia");
  assert.equal(intel.mediaType, "screen");
  assert.equal(intel.environmentLabel, "UPA");

  // número de destaque = DERIVADO
  assert.ok(intel.monthly);
  assert.equal(intel.monthly.metricType, "modeled_impressions");
  assert.equal(intel.monthly.noun, "impactos potenciais");
  assert.equal(intel.monthly.label, "impactos potenciais/mês");
  assert.equal(intel.monthly.tier, "derived");
  assert.equal(intel.monthly.value, 142_680);
  assert.equal(intel.dailyReference?.value, Math.round(142_680 / 30));

  // base de circulação = MEDIDA, preservada como `procedures`
  assert.ok(intel.baseMetric);
  assert.equal(intel.baseMetric.metricType, "procedures");
  assert.equal(intel.baseMetric.label, "procedimentos/mês");
  assert.equal(intel.baseMetric.value, 71_340);
  assert.equal(intel.baseMetric.tier, "measured"); // fonte InfoSaúde A

  // "Como calculamos?" disponível
  assert.ok(intel.methodology?.summary.includes("não pessoas únicas"));
  assert.ok(intel.methodology?.formula.includes("2,00"));
});

test("2. UPA sem Tela / não-UPA / inexistente não recebe cálculo de Tela", () => {
  assert.equal(getUpaScreenPointIntelligence("na-hora-gama"), null); // só WiFi
  assert.equal(getUpaScreenPointIntelligence("estacao-central-plano-piloto"), null); // LED, sem Tela
  assert.equal(getUpaScreenPointIntelligence("hospital-regional-de-taguatinga"), null); // tem Tela, mas Hospital ≠ UPA
  assert.equal(getUpaScreenPointIntelligence("nao-existe-xyz"), null);
});

test("3+4+5. procedimentos corretos por slug e impacto derivado programaticamente (= proc × 2)", () => {
  for (const [slug, expected] of Object.entries(UPA_EXPECTED)) {
    const intel = screenOf(slug);
    assert.equal(intel.baseMetric?.value, expected.procedures, `${slug}: procedimentos`);
    assert.equal(intel.monthly?.value, expected.impressions, `${slug}: impactos potenciais`);
    // derivado, não gravado
    assert.equal(intel.monthly?.value, estimateUpaScreenImpressions(expected.procedures));
    assert.equal(intel.monthly?.value, Math.round(expected.procedures * 2));
  }
});

test("modelo aprovado: 1,25 × 0,80 × 2,0 = 2,0 (fatores não alterados)", () => {
  assert.equal(UPA_SCREEN_MODEL.presenceFactor, 1.25);
  assert.equal(UPA_SCREEN_MODEL.exposureFactor, 0.8);
  assert.equal(UPA_SCREEN_MODEL.effectiveExposureFrequency, 2.0);
  assert.equal(UPA_SCREEN_MULTIPLIER, 2.0);
  assert.equal(estimateUpaScreenImpressions(71_340), 142_680);
});

test("6. múltiplas UPAs somam num único grupo (mesma metodologia); não misturam com LED", () => {
  const upas = ["upa-ceilandia", "upa-samambaia"].map((slug) => ({
    slug,
    name: slug,
    intelligence: screenOf(slug),
  }));
  const rollup = rollupCampaignAudience(upas);
  assert.equal(rollup.ledPointCount, 2);
  assert.equal(rollup.metricGroups.length, 1);
  assert.equal(rollup.metricGroups[0].metricType, "modeled_impressions");
  assert.equal(rollup.metricGroups[0].total, 142_680 + 113_130);
  assert.equal(rollup.environmentsLabel, "UPA");

  // UPA (Tela) + estação (LED) → dois grupos distintos, nunca somados
  const led = getLedPointIntelligence("estacao-central-plano-piloto");
  assert.ok(led);
  const mixed = rollupCampaignAudience([
    ...upas,
    { slug: "estacao-central-plano-piloto", name: "Central", intelligence: led },
  ]);
  assert.equal(mixed.metricGroups.length, 2);
  const kinds = mixed.metricGroups.map((g) => g.metricType).sort();
  assert.deepEqual(kinds, ["audited_impacts", "modeled_impressions"]);
  assert.equal(mixed.environmentsLabel, "UPA + Metrô");
});

test("7. duração recalcula o potencial do período (monthly × D / 30)", () => {
  const rollup = rollupCampaignAudience([
    { slug: "upa-ceilandia", name: "UPA Ceilândia", intelligence: screenOf("upa-ceilandia") },
  ]);
  const r15 = simulateCampaign(rollup, { days: 15, insertionsPerDay: 120 });
  const group = r15.potentialGroups.find((g) => g.metricType === "modeled_impressions");
  assert.ok(group);
  assert.equal(group.monthly, 142_680);
  assert.equal(group.windowPotential, 71_340); // 142.680 × 15 / 30
  assert.equal(group.dailyReference, Math.round(142_680 / 30));

  const r30 = simulateCampaign(rollup, { days: 30, insertionsPerDay: 120 });
  assert.equal(
    r30.potentialGroups.find((g) => g.metricType === "modeled_impressions")?.windowPotential,
    142_680,
  );
});

test("8. total de inserções = dias × inserções/dia", () => {
  const rollup = rollupCampaignAudience([
    { slug: "upa-gama", name: "UPA Gama", intelligence: screenOf("upa-gama") },
  ]);
  assert.equal(
    simulateCampaign(rollup, { days: 15, insertionsPerDay: 120 }).totalInsertions,
    1_800,
  );
});

test("9. inserções NÃO alteram impacto sem metodologia de SOV", () => {
  const rollup = rollupCampaignAudience([
    { slug: "upa-ceilandia", name: "UPA Ceilândia", intelligence: screenOf("upa-ceilandia") },
  ]);
  const few = simulateCampaign(rollup, { days: 15, insertionsPerDay: 10 });
  const many = simulateCampaign(rollup, { days: 15, insertionsPerDay: 900 });
  // potencial do ambiente é idêntico — não depende de inserções
  assert.deepEqual(
    few.potentialGroups.map((g) => g.windowPotential),
    many.potentialGroups.map((g) => g.windowPotential),
  );
  // e nenhuma "entrega de campanha" é fabricada
  assert.equal(few.campaignImpacts, null);
  assert.equal(many.campaignImpacts, null);
  assert.ok(many.missingVariable && many.missingVariable.length > 0);
});

test("10+11. ausência de demografia / de procedimentos não quebra rollup nem simulação", () => {
  const noProcedures: PointIntelligence = {
    slug: "upa-sem-dados",
    mediaType: "screen",
    researchCategory: "UPA",
    environmentLabel: "UPA",
    // sem monthly, sem baseMetric, sem demographics
    behavior: { dwellTime: "1 hora ou mais" },
    profileIsCategoryLevel: true,
  };
  const rollup = rollupCampaignAudience([
    { slug: "upa-sem-dados", name: "UPA sem dados", intelligence: noProcedures },
  ]);
  assert.equal(rollup.ledPointCount, 1);
  assert.equal(rollup.metricGroups.length, 0); // nada a somar, não quebra
  assert.equal(rollup.averageAge, undefined);
  const result = simulateCampaign(rollup, { days: 20, insertionsPerDay: 100 });
  assert.equal(result.potentialGroups.length, 0);
  assert.equal(result.totalInsertions, 2_000);
});

test("12. trocar Tela por outro serviço remove o contexto de Tela", () => {
  assert.ok(getPointIntelligence("upa-ceilandia", ["screen"]));
  assert.equal(getPointIntelligence("upa-ceilandia", ["wifi"]), null);
  assert.equal(getPointIntelligence("upa-ceilandia", []), null);
});

test("demografia é do PONTO (varia por UPA), não um perfil de categoria fixo", () => {
  const ceilandia = screenOf("upa-ceilandia");
  const brazlandia = screenOf("upa-brazlandia");
  assert.ok(ceilandia.demographics?.averageAge);
  assert.ok(brazlandia.demographics?.averageAge);
  assert.notEqual(ceilandia.demographics?.averageAge, brazlandia.demographics?.averageAge);
  // permanência/perfil/interesses são de categoria (inventário UPA/Hospital)
  assert.equal(ceilandia.profileIsCategoryLevel, true);
  assert.ok(ceilandia.behavior?.consumptionCategories?.length);
});

test("correspondência de fonte ambígua: UPA Riacho Fundo II fica com base tier 'derived' (fonte B)", () => {
  // Ceilândia: fonte InfoSaúde A → base medida
  assert.equal(screenOf("upa-ceilandia").baseMetric?.tier, "measured");
  // Riacho Fundo II: painel lista "UPA Riacho Fundo" (sem II), correspondência
  // não confirmada → sourceQuality B → base entra como 'derived', não 'measured'
  assert.equal(screenOf("upa-riacho-fundo-ii").baseMetric?.tier, "derived");
});

test("formatCompact: número de destaque estimado em formato curto", () => {
  // Intl usa espaço não-quebrável entre número e sufixo — normaliza antes de comparar.
  assert.equal(formatCompact(142_680).replace(/\s/gu, " "), "143 mil");
});
