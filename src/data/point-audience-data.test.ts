import assert from "node:assert/strict";
import test from "node:test";

import { networkPoints, pointMediaTypes } from "./network-points.ts";
import { pointAudienceData } from "./point-audience-data.ts";

const allPoints = networkPoints.flatMap((category) => category.points);
const allSlugs = new Set(allPoints.map((point) => point.slug));

/** Elegível = tem Tela (monitor) e/ou Painel LED — o mesmo critério usado para instalar QR Code físico. */
const eligibleSlugs = new Set(
  allPoints
    .filter((point) => {
      const media = pointMediaTypes(point);
      return media.includes("screen") || media.includes("led");
    })
    .map((point) => point.slug),
);

test("catálogo público mantém 44 pontos e 44 slugs únicos", () => {
  assert.equal(allPoints.length, 44);
  assert.equal(allSlugs.size, 44);
});

test("todo slug de pointAudienceData existe em networkPoints", () => {
  for (const slug of Object.keys(pointAudienceData)) {
    assert.ok(allSlugs.has(slug), `slug "${slug}" não existe em network-points.ts`);
  }
});

test("nenhum registro de pointAudienceData está associado duas vezes (chaves únicas por construção + campo slug bate com a chave)", () => {
  const keys = Object.keys(pointAudienceData);
  assert.equal(new Set(keys).size, keys.length);
  for (const [key, data] of Object.entries(pointAudienceData)) {
    assert.equal(data.slug, key);
  }
});

test("audienceData só existe para pontos elegíveis (Tela/LED) — nunca para pontos só-WiFi", () => {
  for (const slug of Object.keys(pointAudienceData)) {
    assert.ok(eligibleSlugs.has(slug), `slug "${slug}" recebeu audienceData mas não tem Tela/LED`);
  }
});

test("25 registros da planilha == 25 pontos elegíveis (Tela/LED) == 25 associados, 0 UNRESOLVED", () => {
  const associated = Object.keys(pointAudienceData).length;
  assert.equal(eligibleSlugs.size, 25);
  assert.equal(associated, 25);
});

test("19 pontos elegíveis-negativos (só WiFi) permanecem sem audienceData", () => {
  const withoutData = allPoints.filter((point) => !(point.slug in pointAudienceData));
  assert.equal(withoutData.length, 44 - 25);
  for (const point of withoutData) {
    assert.ok(
      !eligibleSlugs.has(point.slug),
      `"${point.slug}" é elegível mas ficou sem audienceData`,
    );
  }
});

test("sanity: nenhum valor de métrica é 0, NaN ou negativo (N/D nunca vira zero)", () => {
  for (const data of Object.values(pointAudienceData)) {
    assert.ok(data.metrics.length > 0, `"${data.slug}" não tem nenhuma métrica`);
    for (const metric of data.metrics) {
      assert.equal(typeof metric.value, "number");
      assert.ok(
        Number.isFinite(metric.value) && metric.value > 0,
        `"${data.slug}".${metric.type} inválido`,
      );
    }
  }
});

test("sanity: renda, quando presente, tem valor positivo e tipo domiciliar/familiar/per_capita", () => {
  for (const data of Object.values(pointAudienceData)) {
    if (!data.income) continue;
    assert.ok(data.income.value > 0);
    assert.ok(["domiciliar", "familiar", "per_capita"].includes(data.income.type));
  }
});

test("sanity: passageiros e impactos auditados (Datavision) nunca se fundem — quando ambos existem, são duas entradas distintas em metrics[]", () => {
  for (const data of Object.values(pointAudienceData)) {
    const passengers = data.metrics.filter((m) => m.type === "passengers");
    const impacts = data.metrics.filter((m) => m.type === "audited_impacts");
    assert.ok(passengers.length <= 1);
    assert.ok(impacts.length <= 1);
    if (passengers.length === 1 && impacts.length === 1) {
      assert.equal(
        data.metrics.length,
        2,
        `"${data.slug}" deveria ter exatamente passengers + audited_impacts`,
      );
    }
  }
});

test("sanity: procedimentos e atendimentos nunca reclassificados como 'pessoas' — tipos preservados literalmente", () => {
  const typesUsed = new Set(
    Object.values(pointAudienceData).flatMap((d) => d.metrics.map((m) => m.type)),
  );
  // Confirma que a granularidade original da planilha sobreviveu à importação:
  // nenhuma dessas categorias foi generalizada para um único "fluxo mensal" genérico.
  assert.ok(typesUsed.has("passengers"));
  assert.ok(typesUsed.has("attendances"));
  assert.ok(typesUsed.has("procedures"));
  assert.ok(typesUsed.has("outpatient_consultations"));
  assert.ok(typesUsed.has("estimated_visitors"));
  assert.ok(typesUsed.has("audited_impacts"));
});

test("sanity: todo audited_impacts é sourceQuality A e citação Mídia Kit/Datavision (regra Mídia Kit)", () => {
  for (const data of Object.values(pointAudienceData)) {
    for (const metric of data.metrics) {
      if (metric.type !== "audited_impacts") continue;
      assert.equal(metric.sourceQuality, "A");
      assert.match(metric.source, /Datavision|Mídia Kit/i);
    }
  }
});

test("7 pontos (5 Metrô + 2 BRT) têm impactos Mídia Kit preservados; os outros 18 não têm métrica de impacto", () => {
  const withImpacts = Object.values(pointAudienceData).filter((d) =>
    d.metrics.some((m) => m.type === "audited_impacts"),
  );
  assert.equal(withImpacts.length, 7);
});

/**
 * Regressão: estas 7 UPAs foram corrigidas de "attendances" (relatório
 * SES-DF/IgesDF, quadrimestral) para "procedures" (painel oficial
 * InfoSaúde/SES-DF, média jan-jun/2026, conferida manualmente pelo cliente).
 * Não recalcular/pesquisar de novo — os valores abaixo são a fonte de
 * verdade travada por este teste.
 */
const correctedUpaProcedures: Record<string, number> = {
  "upa-brazlandia": 25732,
  "upa-ceilandia-setor-o": 62165,
  "upa-ceilandia": 71340,
  "upa-gama": 42061,
  "upa-planaltina": 31497,
  "upa-vicente-pires": 45098,
  "upa-samambaia": 56565,
};

test("as 7 UPAs corrigidas usam procedures/mês (InfoSaúde jan-jun/2026), não attendances", () => {
  for (const [slug, expectedValue] of Object.entries(correctedUpaProcedures)) {
    const data = pointAudienceData[slug];
    assert.ok(data, `"${slug}" não existe em pointAudienceData`);

    const procedures = data.metrics.find((m) => m.type === "procedures");
    assert.ok(procedures, `"${slug}" deveria ter uma métrica "procedures"`);
    assert.equal(procedures.value, expectedValue, `"${slug}".procedures.value incorreto`);
    assert.equal(procedures.unit, "procedimentos/mês");
    assert.equal(procedures.sourceQuality, "A");
    assert.match(procedures.source, /InfoSaúde/);

    const attendances = data.metrics.find((m) => m.type === "attendances");
    assert.equal(attendances, undefined, `"${slug}" não deveria mais ter métrica "attendances"`);
  }
});
