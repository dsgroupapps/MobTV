import assert from "node:assert/strict";
import test from "node:test";

import { pointAudienceData } from "./point-audience-data.ts";
import { pointsByRegion, pointsWithoutDerivedRegion } from "./df-regions.ts";
import {
  allNetworkPoints,
  isWifiCampaignAvailable,
  networkPoints,
  pointMediaTypes,
  pointsByCategory,
  pointsWithoutCoordinates,
  totalPointsCount,
  wifiActivePointsCount,
  wifiCampaignStatus,
  wifiPointsCount,
  wifiTemporarilyUnavailablePointsCount,
  wifiUnconfirmedPointsCount,
} from "./network-points.ts";

const bySlug = new Map(allNetworkPoints.map((point) => [point.slug, point]));

const activeWifiSlugs = new Set([
  "rodoviaria-interestadual",
  "terminal-brt-gama",
  "terminal-brt-santa-maria",
  "rodoviaria-de-sobradinho",
  "terminal-setor-o",
  "estacao-aguas-claras",
  "estacao-arniqueiras",
  "estacao-ceilandia-centro",
  "estacao-ceilandia-norte",
  "estacao-ceilandia-sul",
  "estacao-central-plano-piloto",
  "estacao-feira",
  "estacao-guara",
  "estacao-guariroba",
  "estacao-shopping",
  "feira-da-ceilandia",
  "feira-do-guara",
  "feira-de-samambaia",
  "feira-modelo-de-sobradinho-i",
  "hospital-regional-de-ceilandia",
  "hospital-regional-do-gama",
  "hospital-regional-de-santa-maria",
  "hospital-regional-de-taguatinga",
  "hospital-regional-de-sobradinho",
  "hospital-sol-nascente",
  "na-hora-ceilandia",
  "na-hora-gama",
  "na-hora-sobradinho",
  "na-hora-taguatinga",
  "na-hora-rodoviaria-plano-piloto",
  "na-hora-samambaia",
  "upa-brazlandia",
  "upa-ceilandia",
  "upa-gama",
  "upa-planaltina",
  "upa-recanto-das-emas",
  "upa-riacho-fundo-ii",
  "upa-samambaia",
  "upa-ceilandia-setor-o",
  "upa-sobradinho-ii",
  "upa-vicente-pires",
]);

const temporarilyUnavailableWifiSlugs = new Set([
  "terminal-de-sobradinho-ii",
  "feira-samambaia-2",
  "na-hora-brazlandia",
  "biblioteca-de-ceilandia",
  "ubs-05-arapoanga",
  "ubs-06-arapoanga",
]);

const historicalWifiWithoutOperationalConfirmation = new Set([
  "rodoviaria-do-plano-piloto",
  "feira-dos-goianos",
]);

const newPoints = new Map([
  ["rodoviaria-interestadual", "terminais"],
  ["terminal-de-sobradinho-ii", "terminais"],
  ["hospital-sol-nascente", "hospitais"],
  ["na-hora-samambaia", "servicos"],
  ["biblioteca-de-ceilandia", "bibliotecas"],
  ["ubs-05-arapoanga", "ubs"],
  ["ubs-06-arapoanga", "ubs"],
] as const);

const oldDoohBySlug = new Map([
  ["estacao-central-plano-piloto", ["led"]],
  ["estacao-shopping", ["led"]],
  ["estacao-aguas-claras", ["led"]],
  ["estacao-arniqueiras", ["led"]],
  ["estacao-praca-do-relogio", ["led"]],
  ["rodoviaria-de-sobradinho", ["screen"]],
  ["terminal-brt-santa-maria", ["screen", "led"]],
  ["terminal-brt-gama", ["screen", "led"]],
  ["terminal-setor-o", ["screen"]],
  ["upa-ceilandia", ["screen"]],
  ["upa-samambaia", ["screen"]],
  ["upa-sao-sebastiao", ["screen"]],
  ["upa-sobradinho-ii", ["screen"]],
  ["upa-gama", ["screen"]],
  ["upa-recanto-das-emas", ["screen"]],
  ["upa-riacho-fundo-ii", ["screen"]],
  ["upa-planaltina", ["screen"]],
  ["upa-vicente-pires", ["screen"]],
  ["upa-brazlandia", ["screen"]],
  ["upa-ceilandia-setor-o", ["screen"]],
  ["hospital-regional-de-taguatinga", ["screen"]],
  ["hospital-regional-de-ceilandia", ["screen"]],
  ["hospital-regional-do-gama", ["screen"]],
  ["hospital-regional-de-santa-maria", ["screen"]],
  ["feira-do-guara", ["screen"]],
] as const);

const oldImpactBySlug = new Map([
  ["estacao-central-plano-piloto", 2_167_660],
  ["estacao-shopping", 732_239],
  ["estacao-aguas-claras", 1_000_000],
  ["estacao-arniqueiras", 1_128_365],
  ["estacao-praca-do-relogio", 1_063_504],
  ["terminal-brt-gama", 2_149_173],
  ["terminal-brt-santa-maria", 3_745_600],
] as const);

test("lista operacional atualiza somente WiFi e normaliza aliases sem duplicar pontos", () => {
  assert.equal(totalPointsCount, 51);
  assert.equal(new Set(allNetworkPoints.map((point) => point.slug)).size, totalPointsCount);
  assert.equal(activeWifiSlugs.size, 41);
  assert.equal(temporarilyUnavailableWifiSlugs.size, 6);
  assert.equal(bySlug.has("terminal-do-brt-do-gama"), false);
  assert.equal(bySlug.has("upa-setor-o"), false);
  assert.equal(bySlug.has("na-hora-rodoviaria"), false);
  for (const slug of activeWifiSlugs)
    assert.equal(wifiCampaignStatus(bySlug.get(slug)!), "active", slug);
  for (const slug of temporarilyUnavailableWifiSlugs)
    assert.equal(wifiCampaignStatus(bySlug.get(slug)!), "temporarily_unavailable", slug);
  assert.deepEqual(
    new Set(
      allNetworkPoints
        .filter((point) => wifiCampaignStatus(point) === "active")
        .map((point) => point.slug),
    ),
    activeWifiSlugs,
  );
});

test("WiFi histórico fora da lista não é tratado como campanha ativa", () => {
  for (const slug of historicalWifiWithoutOperationalConfirmation) {
    const point = bySlug.get(slug)!;
    assert.equal(pointMediaTypes(point).includes("wifi"), true, slug);
    assert.equal(wifiCampaignStatus(point), "unconfirmed", slug);
    assert.equal(isWifiCampaignAvailable(point), false, slug);
  }
});

test("novos pontos são físicos, têm somente WiFi confirmado e não ganham dados inventados", () => {
  for (const [slug, categoryKey] of newPoints) {
    const point = bySlug.get(slug);
    const category = networkPoints.find((item) => item.key === categoryKey);
    assert.ok(point, slug);
    assert.ok(category?.points.includes(point!), `${slug} fora de ${categoryKey}`);
    assert.deepEqual(pointMediaTypes(point!), ["wifi"]);
    assert.equal(point!.produtos, undefined);
    assert.equal(point!.impactosAuditadosMes, undefined);
    assert.equal(point!.fluxoMensal, undefined);
    assert.equal(point!.location, undefined);
    assert.equal(pointAudienceData[slug], undefined);
  }
  assert.equal(newPoints.size, 7);
});

test("DOOH, impactos e audience dos pontos anteriores permanecem intactos", () => {
  for (const [slug, media] of oldDoohBySlug) {
    const dooh = pointMediaTypes(bySlug.get(slug)!).filter((type) => type !== "wifi");
    assert.deepEqual(dooh, media, slug);
  }
  for (const [slug, value] of oldImpactBySlug)
    assert.equal(bySlug.get(slug)?.impactosAuditadosMes, value, slug);
  assert.deepEqual(Object.keys(pointAudienceData).sort(), [...oldDoohBySlug.keys()].sort());
});

test("contagens derivadas refletem a fonte atual e as novas categorias", () => {
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
  assert.equal(wifiPointsCount, 49);
  assert.equal(wifiActivePointsCount, 41);
  assert.equal(wifiTemporarilyUnavailablePointsCount, 6);
  assert.equal(wifiUnconfirmedPointsCount, 2);
  assert.deepEqual(pointsWithoutCoordinates.map((point) => point.slug).sort(), [
    "biblioteca-de-ceilandia",
    "hospital-sol-nascente",
    "na-hora-samambaia",
    "na-hora-sobradinho",
    "rodoviaria-interestadual",
    "terminal-de-sobradinho-ii",
    "ubs-05-arapoanga",
    "ubs-06-arapoanga",
  ]);
});

test("RAs são derivadas sem atribuir região aos pontos sem base confiável", () => {
  assert.deepEqual(pointsByRegion, {
    "Águas Claras": 2,
    Brazlândia: 2,
    Ceilândia: 11,
    Gama: 4,
    Guará: 4,
    Planaltina: 1,
    "Plano Piloto": 3,
    "Recanto das Emas": 1,
    "Riacho Fundo II": 1,
    Samambaia: 4,
    "Santa Maria": 2,
    "São Sebastião": 1,
    Sobradinho: 4,
    "Sobradinho II": 2,
    Taguatinga: 4,
    "Vicente Pires": 1,
  });
  assert.deepEqual(pointsWithoutDerivedRegion.map((point) => point.slug).sort(), [
    "hospital-sol-nascente",
    "rodoviaria-interestadual",
    "ubs-05-arapoanga",
    "ubs-06-arapoanga",
  ]);
});
