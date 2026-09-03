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
  estimateTerminalScreenImpressions,
  getTerminalScreenPointIntelligence,
  TERMINAL_SCREEN_MODEL,
  TERMINAL_SCREEN_MULTIPLIER,
} from "./terminal-screen.ts";
import { getLedPointIntelligence } from "./led.ts";

function terminalOf(slug: string): PointIntelligence {
  const intel = getTerminalScreenPointIntelligence(slug);
  assert.ok(intel, `esperava inteligência de Tela/terminal para "${slug}"`);
  return intel;
}

function entryOf(slug: string) {
  return { slug, name: slug, intelligence: terminalOf(slug) };
}

test("modelo aprovado: 0,80 × 1,50 = 1,20 (fatores não alterados)", () => {
  assert.equal(TERMINAL_SCREEN_MODEL.exposureFactor, 0.8);
  assert.equal(TERMINAL_SCREEN_MODEL.effectiveExposureFrequency, 1.5);
  assert.equal(TERMINAL_SCREEN_MULTIPLIER, 1.2);
  assert.equal(estimateTerminalScreenImpressions(450_000), 540_000);
});

test("1. terminal com Datavision continua usando o impacto MEDIDO (não fluxo × modelo)", () => {
  for (const slug of ["terminal-brt-gama", "terminal-brt-santa-maria"]) {
    const intel = terminalOf(slug);
    assert.equal(intel.mediaType, "screen");
    assert.ok(intel.monthly);
    assert.equal(intel.monthly.metricType, "audited_impacts");
    assert.equal(intel.monthly.tier, "measured");
    assert.equal(intel.baseMetric, undefined); // medido: sem base de circulação
    assert.equal(intel.methodology, undefined); // medido: sem "como calculamos?"
  }
  assert.equal(terminalOf("terminal-brt-gama").monthly?.value, 2_149_173);
  assert.equal(terminalOf("terminal-brt-santa-maria").monthly?.value, 3_745_600);
});

test("2. Terminal Setor O usa fluxo → impacto potencial modelado (fluxo × 1,20)", () => {
  const intel = terminalOf("terminal-setor-o");
  assert.ok(intel.monthly);
  assert.equal(intel.monthly.metricType, "modeled_impressions");
  assert.equal(intel.monthly.value, 540_000); // 450.000 × 1,20
  assert.equal(intel.monthly.value, estimateTerminalScreenImpressions(450_000));
  assert.ok(intel.baseMetric);
  assert.equal(intel.baseMetric.metricType, "passengers");
  assert.equal(intel.baseMetric.value, 450_000);
  assert.equal(intel.baseMetric.label, "passageiros/mês");
  assert.ok(intel.methodology?.formula.includes("1,20"));
  assert.equal(intel.environmentLabel, "Terminal Rodoviário");
});

test("3. Rodoviária de Sobradinho usa fluxo estimado — valor da base atual (840k), não o preliminar 300k", () => {
  const intel = terminalOf("rodoviaria-de-sobradinho");
  assert.ok(intel.monthly);
  assert.equal(intel.monthly.metricType, "modeled_impressions");
  // base atual do projeto = 840.000/mês (fonte de imprensa datada, qualidade B),
  // melhor que a referência preliminar de ~300.000 do briefing (qualidade C).
  assert.equal(intel.baseMetric?.value, 840_000);
  assert.equal(intel.monthly.value, 1_008_000); // 840.000 × 1,20
});

test("4. nenhum ponto recebe fluxo de outro slug", () => {
  assert.equal(terminalOf("terminal-setor-o").baseMetric?.value, 450_000);
  assert.equal(terminalOf("rodoviaria-de-sobradinho").baseMetric?.value, 840_000);
});

test("5+6. `Tela` ativa a inteligência; outro serviço não a mantém", () => {
  assert.ok(getPointIntelligence("terminal-setor-o", ["screen"]));
  assert.equal(getPointIntelligence("terminal-setor-o", ["wifi"]), null);
  assert.equal(getPointIntelligence("terminal-setor-o", []), null);
  // terminal-setor-o não tem LED → pedir só `led` também não traz Tela
  assert.equal(getPointIntelligence("terminal-setor-o", ["led"]), null);
});

test("6b. ponto não-terminal / sem Tela / inexistente → null", () => {
  assert.equal(getTerminalScreenPointIntelligence("upa-gama"), null); // UPA
  assert.equal(getTerminalScreenPointIntelligence("estacao-central-plano-piloto"), null); // metrô, sem Tela
  assert.equal(getTerminalScreenPointIntelligence("rodoviaria-do-plano-piloto"), null); // terminal só WiFi
  assert.equal(getTerminalScreenPointIntelligence("nao-existe"), null);
});

test("7+8. impacto derivado programaticamente; fonte/confiança da base preservadas", () => {
  const setorO = terminalOf("terminal-setor-o");
  assert.match(setorO.baseMetric?.source ?? "", /Correio Braziliense/);
  assert.equal(setorO.baseMetric?.tier, "derived"); // sourceQuality B + estimated
  assert.equal(setorO.monthly?.tier, "derived");
  assert.equal(setorO.monthly?.estimated, true);
  assert.match(setorO.monthly?.source ?? "", /Estimativa MOBTV/);
});

test("9. múltiplos terminais: impactos potenciais somam num único grupo", () => {
  const rollup = rollupCampaignAudience([
    entryOf("terminal-setor-o"),
    entryOf("rodoviaria-de-sobradinho"),
  ]);
  assert.equal(rollup.metricGroups.length, 1);
  assert.equal(rollup.metricGroups[0].metricType, "modeled_impressions");
  assert.equal(rollup.metricGroups[0].total, 540_000 + 1_008_000);
  assert.equal(rollup.impactPotentialMixed, false);
});

test("9b. medido (Datavision) + modelado (terminal) → grupos distintos + potencial total combinado", () => {
  const rollup = rollupCampaignAudience([
    entryOf("terminal-setor-o"), // modelado
    entryOf("terminal-brt-gama"), // medido
  ]);
  assert.equal(rollup.metricGroups.length, 2);
  const kinds = rollup.metricGroups.map((g) => g.metricType).sort();
  assert.deepEqual(kinds, ["audited_impacts", "modeled_impressions"]);
  assert.equal(rollup.impactPotentialMixed, true);
  assert.equal(rollup.impactPotentialTotal, 540_000 + 2_149_173);

  const result = simulateCampaign(rollup, { days: 30, insertionsPerDay: 120 });
  assert.equal(result.combinesMeasuredAndModeled, true);
  assert.equal(result.combinedImpactWindow, 540_000 + 2_149_173); // 30 dias = mês cheio
  // procedência preservada: dois blocos separados
  assert.equal(result.potentialGroups.length, 2);
});

test("10+11+12. duração recalcula; total de inserções; inserções não inflam impacto", () => {
  const rollup = rollupCampaignAudience([entryOf("terminal-setor-o")]);
  const r = simulateCampaign(rollup, { days: 15, insertionsPerDay: 120 });
  assert.equal(r.totalInsertions, 1_800);
  const group = r.potentialGroups.find((g) => g.metricType === "modeled_impressions");
  assert.equal(group?.windowPotential, 270_000); // 540.000 × 15 / 30

  const more = simulateCampaign(rollup, { days: 15, insertionsPerDay: 900 });
  assert.equal(
    more.potentialGroups.find((g) => g.metricType === "modeled_impressions")?.windowPotential,
    270_000,
  );
  assert.equal(more.campaignImpacts, null);
  assert.ok(more.missingVariable && more.missingVariable.length > 0);
});

test("13. dados ausentes não quebram (terminal sem fluxo nem Datavision → sem monthly)", () => {
  const bare: PointIntelligence = {
    slug: "terminal-sem-dados",
    mediaType: "screen",
    researchCategory: "Terminal Rodoviário",
    environmentLabel: "Terminal Rodoviário",
    demographics: { averageAge: 35 },
  };
  const rollup = rollupCampaignAudience([
    { slug: "terminal-sem-dados", name: "Terminal sem dados", intelligence: bare },
  ]);
  assert.equal(rollup.metricGroups.length, 0);
  assert.equal(rollup.ledPointCount, 1);
  assert.equal(rollup.averageAge, 35);
  const result = simulateCampaign(rollup, { days: 10, insertionsPerDay: 50 });
  assert.equal(result.potentialGroups.length, 0);
  assert.equal(result.totalInsertions, 500);
});

test("demografia é do PONTO (Setor O ≠ Sobradinho); rodoviárias não recebem perfil de categoria fabricado", () => {
  const setorO = terminalOf("terminal-setor-o");
  const sobradinho = terminalOf("rodoviaria-de-sobradinho");
  assert.ok(setorO.demographics?.averageAge);
  assert.ok(sobradinho.demographics?.averageAge);
  assert.notEqual(setorO.demographics?.averageAge, sobradinho.demographics?.averageAge);
  // Terminal Rodoviário não tem dwell/perfil/interesses na base → sem bloco fabricado
  assert.equal(setorO.behavior, undefined);
  assert.equal(setorO.profileIsCategoryLevel, undefined);
});

test("BRT via Tela carrega o perfil de categoria (Metrô/BRT) além do impacto medido", () => {
  const gama = terminalOf("terminal-brt-gama");
  assert.equal(gama.profileIsCategoryLevel, true);
  assert.ok(gama.behavior?.dwellTime);
  assert.ok(gama.behavior?.consumptionCategories?.length);
});

test("dispatcher: BRT com `screen` e BRT com `led` mostram o MESMO impacto medido", () => {
  const viaScreen = getPointIntelligence("terminal-brt-santa-maria", ["screen"]);
  const viaLed = getLedPointIntelligence("terminal-brt-santa-maria");
  assert.equal(viaScreen?.monthly?.value, 3_745_600);
  assert.equal(viaLed?.monthly?.value, 3_745_600);
  assert.equal(viaScreen?.monthly?.metricType, "audited_impacts");
});

test("formatCompact para o destaque do terminal", () => {
  assert.equal(formatCompact(540_000).replace(/\s/gu, " "), "540 mil");
});
