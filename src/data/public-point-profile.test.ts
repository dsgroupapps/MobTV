import assert from "node:assert/strict";
import test from "node:test";
import { publicPointProfile } from "./public-point-profile.ts";
import { pointAudienceData } from "./point-audience-data.ts";
import { getPointInsights, type PointInsights } from "./point-insights.ts";

const slug = "hospital-regional-de-santa-maria";
const demo: PointInsights = {
  slug,
  isDemo: true,
  monthlyAudience: 85_000,
  averageFamilyIncome: 999_999,
  audience: { femalePercent: 52, malePercent: 48, ageBrackets: [{ label: "18–24", percent: 14 }] },
};

test("HRSM público usa gênero real e nunca a distribuição etária fictícia", () => {
  assert.equal(getPointInsights(slug), undefined);
  const profile = publicPointProfile(pointAudienceData[slug], demo);
  assert.deepEqual(profile.audience, { femalePercent: 52.5, malePercent: 47.5 });
  assert.equal(profile.primaryMetric?.value, 21_086);
  assert.equal(profile.income?.value, 3813.9);
  assert.equal(profile.monthlyAudience, undefined);
  assert.equal(profile.averageFamilyIncome, undefined);
});

test("ausência parcial ou total de dados reais não ativa fallback demonstrativo", () => {
  for (const data of [
    undefined,
    { ...pointAudienceData[slug], metrics: [], income: undefined, demographics: undefined },
  ]) {
    const profile = publicPointProfile(data, demo);
    assert.equal(profile.primaryMetric, undefined);
    assert.equal(profile.income, undefined);
    assert.equal(profile.audience, undefined);
    assert.equal(profile.monthlyAudience, undefined);
    assert.equal(profile.averageFamilyIncome, undefined);
  }
});
