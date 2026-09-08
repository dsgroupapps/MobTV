import assert from "node:assert/strict";
import test from "node:test";
import { networkPoints, pointMediaTypes } from "../../../data/network-points.ts";
import { pointAudienceData } from "../../../data/point-audience-data.ts";
import { getPointIntelligence, rollupCampaignAudience, simulateCampaign } from "./index.ts";
import { HEALTHCARE_SCREEN_MODELS } from "./healthcare-model.ts";
import { UPA_SCREEN_MODEL } from "./screen.ts";
import { HOSPITAL_SCREEN_MODEL } from "./hospital-screen.ts";

const brts = { "terminal-brt-gama": 2_149_173, "terminal-brt-santa-maria": 3_745_600 };

test("BRT LED e Tela preservam referência medida, fonte, competência e ressalva do monitor", () => {
  for (const [slug, value] of Object.entries(brts)) {
    for (const media of ["led", "screen"] as const) {
      const intel = getPointIntelligence(slug, [media]);
      assert.ok(intel?.monthly);
      assert.equal(intel.monthly.value, value);
      assert.equal(intel.monthly.metricType, "audited_impacts");
      assert.equal(intel.monthly.tier, "measured");
      assert.equal(intel.monthly.estimated, false);
      assert.equal(intel.monthly.measurementScope, "environment_reference");
      assert.equal(intel.monthly.sourceQuality, "A");
      assert.equal(intel.monthly.source, "Datavision / Mídia Kit MOBTV");
      assert.equal(intel.monthly.period, "2024");
      assert.equal(intel.monthly.label, "Impactos mensais de referência do ponto");
      assert.match(intel.monthly.caveat!, /Não representa uma auditoria individual do monitor/);
      assert.equal(intel.methodology?.modelConfidence, undefined);
    }
  }
});

test("BRT com LED + Tela conta uma vez no dispatcher e também em entradas separadas do rollup", () => {
  for (const [slug, value] of Object.entries(brts)) {
    const commercialMedia = ["led", "screen"] as const;
    const both = getPointIntelligence(slug, [...commercialMedia])!;
    assert.equal(
      rollupCampaignAudience([{ slug, name: slug, intelligence: both }]).impactPotentialTotal,
      value,
    );
    for (const order of [
      ["led", "screen"],
      ["screen", "led"],
    ] as const) {
      const rows = order.map((media) => ({
        slug,
        name: slug,
        intelligence: getPointIntelligence(slug, [media])!,
      }));
      const rollup = rollupCampaignAudience(rows);
      assert.equal(rows.length, 2); // não altera entrada nem seleção comercial
      assert.equal(rollup.ledPointCount, 1);
      assert.equal(rollup.metricGroups[0].pointCount, 1);
      assert.equal(rollup.impactPotentialTotal, value);
      assert.equal(
        simulateCampaign(rollup, { days: 30, insertionsPerDay: 120 }).combinedImpactWindow,
        value,
      );
    }
  }
  const rows = Object.keys(brts).flatMap((slug) =>
    (["led", "screen"] as const).map((media) => ({
      slug,
      name: slug,
      intelligence: getPointIntelligence(slug, [media])!,
    })),
  );
  assert.equal(rollupCampaignAudience(rows).impactPotentialTotal, 5_894_773);
});

test("demais LEDs mantêm medições de 2024 e total auditado da rede", () => {
  const rows = networkPoints
    .flatMap((c) => c.points)
    .filter((p) => pointMediaTypes(p).includes("led"))
    .map((p) => {
      const intelligence = getPointIntelligence(p.slug, ["led"])!;
      assert.equal(intelligence.monthly?.period, "2024");
      assert.equal(intelligence.monthly?.value, p.impactosAuditadosMes);
      if (!(p.slug in brts)) assert.equal(intelligence.monthly?.measurementScope, "asset_specific");
      return { slug: p.slug, name: p.nome, intelligence };
    });
  assert.equal(rollupCampaignAudience(rows).impactPotentialTotal, 11_986_541);
});

test("parâmetros assistenciais centralizados, preliminares, separados da qualidade oficial da base", () => {
  assert.equal(UPA_SCREEN_MODEL, HEALTHCARE_SCREEN_MODELS.upa);
  assert.equal(HOSPITAL_SCREEN_MODEL, HEALTHCARE_SCREEN_MODELS.hospital);
  for (const model of Object.values(HEALTHCARE_SCREEN_MODELS)) {
    assert.deepEqual(model, {
      presenceFactor: 1.25,
      exposureFactor: 0.8,
      effectiveExposureFrequency: 2,
    });
  }
  for (const data of Object.values(pointAudienceData).filter((d) =>
    ["UPA", "Hospital"].includes(d.researchCategory),
  )) {
    const intel = getPointIntelligence(data.slug, ["screen"])!;
    assert.equal(intel.methodology?.modelConfidence, "preliminary");
    assert.match(intel.methodology!.formula, /hipótese/);
    assert.match(intel.methodology!.summary, /não pessoas únicas nem circulação medida/);
    assert.equal(intel.monthly?.metricType, "modeled_impressions");
    assert.equal(intel.monthly?.tier, "derived");
    assert.equal(intel.monthly?.estimated, true);
    assert.equal(intel.baseMetric?.estimated, false);
    const quality = data.slug === "upa-riacho-fundo-ii" ? "B" : "A";
    assert.equal(intel.baseMetric?.sourceQuality, quality);
    assert.equal(intel.baseMetric?.tier, quality === "A" ? "measured" : "derived");
    assert.doesNotMatch(intel.baseMetric!.label, /pessoas|circulação/);
    if (data.researchCategory === "Hospital") {
      assert.equal(intel.baseMetric?.label, "consultas/atendimentos/mês");
      assert.doesNotMatch(intel.baseMetric?.caveat ?? "", /piso/);
    }
  }
});
