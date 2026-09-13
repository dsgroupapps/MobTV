import "../lib/planner/test-support.ts"; // hook TSX: permite importar MediaBadges.tsx
import assert from "node:assert/strict";
import test from "node:test";

import {
  allNetworkPoints,
  networkPoints,
  pointMediaTypes,
  publicMediaTypes,
  isWifiTemporarilyUnavailable,
  pointsByCategory,
  pointsWithoutCoordinates,
  totalPointsCount,
  type CategoryKey,
} from "./network-points.ts";
import { activeRegionCount } from "./df-regions.ts";

// MediaBadges é TSX: importado dinamicamente depois que o hook do
// test-support transpila .tsx (imports estáticos resolvem antes do hook).
const { categoryIcon } = await import("../components/site/MediaBadges.tsx");

const bySlug = new Map(allNetworkPoints.map((point) => [point.slug, point]));

// Espelha o que AssetExplorer/Gallery derivam para as abas de categoria: o
// site público deve oferecer TODAS as categorias do catálogo, sem lista fixa.
const derivedCategoryTabs = [
  { key: "todos", label: "Todos" },
  ...networkPoints.map((c) => ({ key: c.key, label: c.label })),
];

test("catálogo público expõe 51 pontos e as 8 categorias com contagem correta", () => {
  assert.equal(totalPointsCount, 51);
  assert.deepEqual(pointsByCategory, {
    metro: 11,
    terminais: 7,
    upas: 11,
    hospitais: 6,
    feiras: 6,
    servicos: 7,
    bibliotecas: 1,
    ubs: 2,
  });
  assert.deepEqual(
    networkPoints.map((c) => c.key),
    ["metro", "terminais", "upas", "hospitais", "feiras", "servicos", "bibliotecas", "ubs"],
  );
});

test("abas de categoria derivadas incluem Bibliotecas e UBSs", () => {
  assert.equal(derivedCategoryTabs.length, 9); // "Todos" + 8 categorias
  const keys = derivedCategoryTabs.map((t) => t.key);
  assert.ok(keys.includes("bibliotecas"));
  assert.ok(keys.includes("ubs"));
  const labels = derivedCategoryTabs.map((t) => t.label);
  assert.ok(labels.includes("Bibliotecas"));
  assert.ok(labels.includes("UBSs"));
});

test("todas as 8 categorias têm ícone visual próprio e distinto", () => {
  const keys: CategoryKey[] = [
    "metro",
    "terminais",
    "upas",
    "hospitais",
    "feiras",
    "servicos",
    "bibliotecas",
    "ubs",
  ];
  for (const key of keys) assert.ok(categoryIcon[key], `sem ícone: ${key}`);
  assert.notEqual(categoryIcon.bibliotecas, categoryIcon.servicos);
  assert.notEqual(categoryIcon.ubs, categoryIcon.upas);
  assert.notEqual(categoryIcon.ubs, categoryIcon.hospitais);
});

test("os 7 novos pontos aparecem no catálogo, na categoria certa", () => {
  const expected: [string, CategoryKey][] = [
    ["rodoviaria-interestadual", "terminais"],
    ["terminal-de-sobradinho-ii", "terminais"],
    ["hospital-sol-nascente", "hospitais"],
    ["na-hora-samambaia", "servicos"],
    ["biblioteca-de-ceilandia", "bibliotecas"],
    ["ubs-05-arapoanga", "ubs"],
    ["ubs-06-arapoanga", "ubs"],
  ];
  for (const [slug, categoryKey] of expected) {
    const point = bySlug.get(slug);
    assert.ok(point, `ausente: ${slug}`);
    const category = networkPoints.find((c) => c.points.includes(point!));
    assert.equal(category?.key, categoryKey, slug);
  }
});

test("publicMediaTypes: WiFi só aparece como disponível quando status active", () => {
  // active
  assert.deepEqual(publicMediaTypes(bySlug.get("na-hora-ceilandia")!), ["wifi"]);
  assert.deepEqual(publicMediaTypes(bySlug.get("hospital-sol-nascente")!), ["wifi"]);
  // temporarily_unavailable → sem "wifi" disponível, mas a infra continua existindo
  for (const slug of ["biblioteca-de-ceilandia", "terminal-de-sobradinho-ii", "ubs-05-arapoanga"]) {
    assert.deepEqual(publicMediaTypes(bySlug.get(slug)!), [], slug);
    assert.ok(pointMediaTypes(bySlug.get(slug)!).includes("wifi"), slug);
    assert.equal(isWifiTemporarilyUnavailable(bySlug.get(slug)!), true, slug);
  }
  // unconfirmed → nunca apresentado como disponível
  for (const slug of ["rodoviaria-do-plano-piloto", "feira-dos-goianos"]) {
    assert.deepEqual(publicMediaTypes(bySlug.get(slug)!), [], slug);
    assert.equal(isWifiTemporarilyUnavailable(bySlug.get(slug)!), false, slug);
  }
  // DOOH nunca é afetado pelo status do WiFi
  assert.deepEqual(publicMediaTypes(bySlug.get("upa-sao-sebastiao")!), ["screen"]);
  assert.deepEqual(publicMediaTypes(bySlug.get("estacao-praca-do-relogio")!), ["led"]);
  assert.deepEqual(publicMediaTypes(bySlug.get("terminal-brt-santa-maria")!), [
    "screen",
    "led",
    "wifi",
  ]);
});

test("pointMediaTypes (verdade estrutural do planner) permanece intacto: 49 pontos com WiFi", () => {
  assert.equal(allNetworkPoints.filter((p) => pointMediaTypes(p).includes("wifi")).length, 49);
});

test("pontos sem coordenada não somem do catálogo; só não teriam marker", () => {
  assert.deepEqual(pointsWithoutCoordinates.map((p) => p.slug).sort(), [
    "terminal-de-sobradinho-ii",
    "ubs-05-arapoanga",
    "ubs-06-arapoanga",
  ]);
  // continuam presentes na listagem completa
  for (const slug of ["terminal-de-sobradinho-ii", "ubs-05-arapoanga", "ubs-06-arapoanga"]) {
    assert.ok(bySlug.has(slug), slug);
  }
  // os novos pontos com coordenada confirmada teriam marker
  for (const slug of [
    "hospital-sol-nascente",
    "rodoviaria-interestadual",
    "biblioteca-de-ceilandia",
    "na-hora-sobradinho",
    "na-hora-samambaia",
  ]) {
    assert.ok(bySlug.get(slug)!.location, slug);
  }
});

test("cobertura pública continua em 16 regiões", () => {
  assert.equal(activeRegionCount, 16);
});
