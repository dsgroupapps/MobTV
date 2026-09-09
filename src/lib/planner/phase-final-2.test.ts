import "./test-support.ts";
import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { networkPoints, pointMediaTypes, type MediaTypeKey } from "../../data/network-points.ts";
import type { PlannerSelection, PlannerStoredState } from "../../data/planner-options.ts";
import {
  getPointIntelligence,
  getWifiPointIntelligence,
  pointAudienceState,
  simulateCampaign,
} from "./audience/index.ts";

const { getPlannerSelectionDetails, rollupPlannerSelection } = await import("./selection.ts");
const { buildPlannerProposal } = await import("./proposal.ts");
const { loadPlannerState, savePlannerState, clearPlannerState, STORAGE_KEY, LEGACY_STORAGE_KEY } =
  await import("./storage.ts");
const { PlannerCampaignReview } = await import("../../components/site/PlannerCampaignReview.tsx");

const sim = { days: 15, insertionsPerDay: 120 };
const selection = (slug: string, media: MediaTypeKey[]): PlannerSelection => ({ slug, media });
const catalog = networkPoints.flatMap((category) => category.points);
const wifiOnly = catalog.filter((point) => pointMediaTypes(point).join() === "wifi");
const detail = (slug: string, media: MediaTypeKey[]) =>
  getPlannerSelectionDetails([selection(slug, media)])[0];
const review = (selections: PlannerSelection[]) =>
  renderToStaticMarkup(
    createElement(PlannerCampaignReview, {
      points: getPlannerSelectionDetails(selections),
      sim,
      onSimChange: () => {},
    }),
  );

test("inventário atualizado preserva DOOH: 51 slugs, 7 LED, 20 Tela e 49 WiFi", () => {
  assert.equal(catalog.length, 51);
  assert.equal(new Set(catalog.map((point) => point.slug)).size, 51);
  for (const [media, count] of [
    ["led", 7],
    ["screen", 20],
    ["wifi", 49],
  ] as const) {
    assert.equal(catalog.filter((point) => pointMediaTypes(point).includes(media)).length, count);
  }
});

test("todos os 49 WiFi têm inteligência sem valor fabricado; mídia inexistente é recusada", () => {
  for (const point of catalog) {
    const intel = getWifiPointIntelligence(point.slug);
    if (pointMediaTypes(point).includes("wifi")) {
      assert.deepEqual(intel, { slug: point.slug, mediaType: "wifi", status: "missing" });
      assert.equal(intel?.metrics, undefined);
    } else assert.equal(intel, null);
  }
  assert.equal(getWifiPointIntelligence("inexistente"), null);
});

test("contrato WiFi futuro distingue métricas e exige correspondência, fonte, período e unidade", () => {
  const slug = wifiOnly[0].slug;
  // Fixtures sintéticas de contrato; nenhum destes valores é cadastrado no produto.
  const metrics = (
    ["wifi_accesses", "sessions", "new_users", "active_users", "views", "engagements"] as const
  ).map((metricType) => ({
    slug,
    metricType,
    value: 123,
    unit: "unidade de teste/mês",
    period: "período de teste",
    source: "fonte de teste",
  }));
  const available = getWifiPointIntelligence(slug, metrics)!;
  assert.equal(available.status, "available");
  assert.deepEqual(available.metrics, metrics);
  for (const invalid of [
    { ...metrics[0], slug: "outro-ponto" },
    { ...metrics[0], source: "" },
    { ...metrics[0], period: " " },
    { ...metrics[0], unit: "" },
    { ...metrics[0], value: NaN },
    { ...metrics[0], value: -1 },
  ])
    assert.equal(getWifiPointIntelligence(slug, [invalid])?.status, "missing");
  // As fixtures nunca viram dado do catálogo nem permanecem após a chamada.
  assert.equal(getWifiPointIntelligence(slug)?.status, "missing");
});

test("WiFi exclusivo aparece na seleção, resumo, configuração e proposta sem audiência numérica", () => {
  for (const point of wifiOnly) {
    const selections = [selection(point.slug, ["wifi"])];
    const points = getPlannerSelectionDetails(selections);
    assert.equal(points[0].slug, point.slug);
    assert.equal(points[0].dooh, null);
    const html = review(selections);
    assert.ok(html.includes(point.nome));
    assert.match(html, /data-summary-item/);
    assert.match(html, /id="sim-days"/);
    assert.doesNotMatch(html, /id="sim-insertions"/);
    assert.match(html, /Dados individuais de audiência em atualização/);
    assert.doesNotMatch(html, /0 acessos|0 impactos|N\/A|undefined|null/);
    const proposal = buildPlannerProposal(points, { ...sim, days: 23 });
    assert.ok(proposal.includes(point.nome));
    assert.match(proposal, /WiFi Ads/);
    assert.match(proposal, /Duração: 23 dias/);
    assert.doesNotMatch(proposal, /Total de referência|0 acessos|0 impactos/);
    assert.equal(rollupPlannerSelection(points).impactPotentialTotal, undefined);
  }
});

test("vários pontos WiFi permanecem distintos e não contribuem numericamente para o rollup", () => {
  const points = getPlannerSelectionDetails(
    wifiOnly.map((point) => selection(point.slug, ["wifi"])),
  );
  assert.equal(points.length, wifiOnly.length);
  assert.equal(rollupPlannerSelection(points).metricGroups.length, 0);
  const proposal = buildPlannerProposal(points, sim);
  for (const point of wifiOnly) assert.ok(proposal.includes(point.nome));
});

for (const [slug, media] of [
  ["terminal-brt-gama", ["led", "wifi"]],
  ["upa-ceilandia", ["screen", "wifi"]],
  ["terminal-brt-gama", ["led", "screen", "wifi"]],
] as [string, MediaTypeKey[]][]) {
  test(`${slug} ${media.join("+")}: WiFi não apaga nem duplica a audiência DOOH`, () => {
    const point = detail(slug, media);
    const original = getPointIntelligence(
      slug,
      media.filter((m) => m !== "wifi"),
    )!;
    assert.deepEqual(point.dooh, original);
    assert.equal(point.wifi?.status, "missing");
    assert.deepEqual(point.media, media);
    assert.equal(rollupPlannerSelection([point]).impactPotentialTotal, original.monthly?.value);
    const html = review([selection(slug, media)]);
    assert.match(html, /data-point-audience/);
    assert.match(html, /data-wifi-audience/);
    assert.match(html, /id="sim-insertions"/);
  });
}

test("ponto com impacto + WiFi exclusivo conserva exatamente o potencial e todos os serviços", () => {
  const dooh = detail("upa-ceilandia", ["screen"]);
  const wifi = detail(wifiOnly[0].slug, ["wifi"]);
  assert.deepEqual(rollupPlannerSelection([dooh, wifi]), rollupPlannerSelection([dooh]));
  assert.ok(buildPlannerProposal([dooh, wifi], sim).includes(wifi.name));
});

test("Feira retorna base parcial de 120.000, demografia e renda, sem modelo de impacto", () => {
  const intel = getPointIntelligence("feira-do-guara", ["screen"])!;
  assert.equal(pointAudienceState(intel), "partial");
  assert.equal(intel.monthly, undefined);
  assert.equal(intel.methodology, undefined);
  assert.equal(intel.baseMetric?.value, 120000);
  assert.equal(intel.baseMetric?.metricType, "estimated_visitors");
  assert.equal(intel.baseMetric?.sourceQuality, "B");
  assert.equal(intel.baseMetric?.estimated, true);
  assert.equal(intel.demographics?.averageAge, 38.1);
  assert.equal(intel.demographics?.genderFemalePercent, 54.4);
  assert.equal(intel.demographics?.genderMalePercent, 45.6);
  assert.equal(intel.demographics?.income?.value, 7979);
});

test("Feira parcial tem grupo de referência separado; duração e inserções não criam impactos", () => {
  const feira = detail("feira-do-guara", ["screen", "wifi"]);
  const rollup = rollupPlannerSelection([feira]);
  assert.equal(rollup.metricGroups.length, 0);
  assert.equal(rollup.referenceGroups[0].total, 120000);
  assert.equal(rollup.impactPotentialTotal, undefined);
  for (const input of [sim, { days: 90, insertionsPerDay: 900 }]) {
    const result = simulateCampaign(rollup, input);
    assert.equal(result.potentialGroups.length, 0);
    assert.equal(result.campaignImpacts, null);
    assert.equal(result.combinedImpactWindow, null);
  }
  const mixed = rollupPlannerSelection([
    feira,
    detail("terminal-brt-gama", ["led", "screen", "wifi"]),
  ]);
  assert.equal(mixed.impactPotentialTotal, 2149173);
  assert.equal(mixed.referenceGroups[0].total, 120000);
});

test("resumo Feira mostra fluxo, fonte, demografia e WiFi independentemente", () => {
  const html = review([selection("feira-do-guara", ["screen", "wifi"])]);
  for (const text of [
    "Feira do Guará",
    "120.000",
    "Fluxo estimado de visitantes",
    "Sem ano-base confirmado",
    "54.4% mulheres",
    "7.979",
    "PDAD 2021",
    "WiFi Ads",
  ])
    assert.ok(html.includes(text), text);
  assert.doesNotMatch(
    html,
    /Estimativa modelada|modeled_impressions|Referência histórica de impactos/,
  );
});

test("quatro estados de audiência mantêm interpretação independente", () => {
  assert.equal(pointAudienceState(getPointIntelligence("terminal-brt-gama", ["led"])!), "measured");
  assert.equal(pointAudienceState(getPointIntelligence("upa-ceilandia", ["screen"])!), "modeled");
  assert.equal(pointAudienceState(getPointIntelligence("feira-do-guara", ["screen"])!), "partial");
  assert.equal(getWifiPointIntelligence(wifiOnly[0].slug)?.status, "missing");
});

test("ordem do resumo: pontos/RA/serviços e audiência, configuração, agregado", () => {
  const html = review([selection("upa-ceilandia", ["screen", "wifi"])]);
  assert.match(html, /Ceilândia/);
  assert.ok(html.indexOf("data-summary-item") < html.indexOf("data-campaign-configuration"));
  assert.ok(html.indexOf("data-campaign-configuration") < html.indexOf("data-campaign-audience"));
  assert.match(html, /sem multiplicar por ponto ou mídia/);
  assert.doesNotMatch(html, /inserções programadas/);
});

test("proposta preserva todos os pontos, RA, mídias exatas, bases e configuração", () => {
  const points = getPlannerSelectionDetails([
    selection("terminal-brt-gama", ["led", "wifi"]),
    selection("upa-ceilandia", ["screen", "wifi"]),
    selection("feira-do-guara", ["screen", "wifi"]),
    selection(wifiOnly[0].slug, ["wifi"]),
  ]);
  const proposal = buildPlannerProposal(points, sim);
  for (const point of points) {
    assert.ok(proposal.includes(point.name));
    assert.ok(point.region && proposal.includes(point.region));
  }
  for (const text of [
    "Painel LED + WiFi Ads",
    "Tela + WiFi Ads",
    "Duração: 15 dias",
    "120 inserções/dia",
    "1.800 inserções",
    "2.149.173",
    "120.000",
    "Datavision",
    "2024",
    "Estimativa preliminar MOBTV",
    "30.000/semana × 4",
    "sem conversão de inserções",
  ])
    assert.ok(proposal.includes(text), text);
  assert.ok(proposal.includes(points[1].dooh!.monthly!.value.toLocaleString("pt-BR")));
  assert.doesNotMatch(
    proposal,
    /undefined|null|0 acessos|0 impactos|modeled_impressions|sourceQuality/,
  );
  assert.equal((proposal.match(/2\.149\.173/g) ?? []).length, 1);
  const decoded = decodeURIComponent(encodeURIComponent(proposal));
  assert.equal(decoded, proposal);
});

test("regressão: todos os impactos medidos e modelos existentes mantêm totais", () => {
  const points = getPlannerSelectionDetails(
    catalog.map((point) => selection(point.slug, pointMediaTypes(point))),
  );
  const rollup = rollupPlannerSelection(points);
  assert.equal(
    rollup.metricGroups.find((group) => group.metricType === "audited_impacts")?.total,
    11986541,
  );
  assert.equal(
    rollup.metricGroups.find((group) => group.metricType === "modeled_impressions")?.total,
    2799480,
  );
  assert.equal(rollup.impactPotentialTotal, 14786021);
  assert.equal(rollup.referenceGroups[0].total, 120000);
  assert.equal(points.length, 51);
});

// sessionStorage realista, sem DOM: testa serialização, reload e migração.
function withStorage(run: (items: Map<string, string>) => void) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
  const items = new Map<string, string>();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      sessionStorage: {
        getItem: (key: string) => items.get(key) ?? null,
        setItem: (key: string, value: string) => items.set(key, value),
        removeItem: (key: string) => items.delete(key),
      },
    },
  });
  try {
    run(items);
  } finally {
    if (descriptor) Object.defineProperty(globalThis, "window", descriptor);
    else Reflect.deleteProperty(globalThis, "window");
  }
}

const state = (selections: PlannerSelection[]): PlannerStoredState => ({
  midia: "both",
  step: 2,
  selections,
  sim,
});

test("storage v2 usa slug e round-trip preserva exatamente LED + WiFi no BRT", () =>
  withStorage((items) => {
    const expected = state([
      selection("terminal-brt-gama", ["led", "wifi"]),
      selection(wifiOnly[0].slug, ["wifi"]),
    ]);
    savePlannerState(expected);
    assert.deepEqual(loadPlannerState(), expected);
    assert.match(items.get(STORAGE_KEY)!, /"slug":"terminal-brt-gama"/);
    assert.doesNotMatch(items.get(STORAGE_KEY)!, /"key"|::|screen/);
    assert.equal(getPlannerSelectionDetails(loadPlannerState()!.selections).length, 2);
  }));

test("estado v1 categoria::nome migra para slug, sem adicionar mídias", () =>
  withStorage((items) => {
    const category = networkPoints.find((category) =>
      category.points.some((point) => point.slug === "terminal-brt-gama"),
    )!;
    const point = category.points.find((point) => point.slug === "terminal-brt-gama")!;
    items.set(
      LEGACY_STORAGE_KEY,
      JSON.stringify({
        ...state([]),
        selections: [{ key: `${category.key}::${point.nome}`, media: ["led", "wifi"] }],
      }),
    );
    const restored = loadPlannerState()!;
    assert.deepEqual(restored.selections, [selection(point.slug, ["led", "wifi"])]);
    savePlannerState(restored);
    assert.ok(items.has(STORAGE_KEY));
    assert.ok(!items.has(LEGACY_STORAGE_KEY));
    assert.deepEqual(loadPlannerState(), restored);
  }));

test("legado sem mídia só recupera ponto com uma única opção", () =>
  withStorage((items) => {
    items.set(
      LEGACY_STORAGE_KEY,
      JSON.stringify({
        selections: networkPoints.flatMap((category) =>
          category.points.map((point) => ({ key: `${category.key}::${point.nome}` })),
        ),
      }),
    );
    const result = loadPlannerState()!;
    assert.equal(
      result.selections.length,
      catalog.filter((point) => pointMediaTypes(point).length === 1).length,
    );
    assert.ok(result.selections.every((point) => point.media.length === 1));
  }));

test("edição, remoção de serviço/ponto e troca WiFi sobrevivem a reload", () =>
  withStorage(() => {
    for (const selections of [
      [selection("terminal-brt-gama", ["led", "screen", "wifi"])],
      [selection("terminal-brt-gama", ["led", "wifi"])],
      [selection("terminal-brt-gama", ["wifi"])],
      [selection(wifiOnly[0].slug, ["wifi"])],
      [],
    ]) {
      savePlannerState(state(selections));
      assert.deepEqual(loadPlannerState()!.selections, selections);
    }
  }));

test("storage rejeita JSON inválido, slugs desconhecidos e mídias inválidas sem expandir escolha", () =>
  withStorage((items) => {
    items.set(STORAGE_KEY, "{inválido");
    assert.equal(loadPlannerState(), null);
    items.set(
      STORAGE_KEY,
      JSON.stringify({
        selections: [
          { slug: "inexistente", media: ["wifi"] },
          { slug: "terminal-brt-gama", media: [] },
          { slug: wifiOnly[0].slug, media: ["screen", "wifi", "wifi", "fake"] },
        ],
      }),
    );
    assert.deepEqual(loadPlannerState()!.selections, [selection(wifiOnly[0].slug, ["wifi"])]);
    clearPlannerState();
    assert.equal(loadPlannerState(), null);
  }));

test("storage indisponível e renderização no servidor não interrompem planner", () => {
  assert.equal(loadPlannerState(), null);
  assert.doesNotThrow(() => savePlannerState(state([])));
  assert.doesNotThrow(() => clearPlannerState());
});
