import assert from "node:assert/strict";
import test from "node:test";

import {
  networkPoints,
  pointMediaTypes,
  campaignAvailableMediaTypes,
  resolveWifiCpe,
  wifiCampaignStatus,
  WIFI_CPE,
} from "../../data/network-points.ts";
import { getPlannerSelectionDetails } from "./selection.ts";
import { buildPlannerProposal } from "./proposal.ts";
import { loadPlannerState, savePlannerState, STORAGE_KEY } from "./storage.ts";
import type { PlannerSelection, PlannerStoredState } from "../../data/planner-options.ts";

const catalog = networkPoints.flatMap((c) => c.points);
const bySlug = new Map(catalog.map((p) => [p.slug, p]));
const sim = { days: 15, insertionsPerDay: 120 };
const sel = (slug: string, media: PlannerSelection["media"]): PlannerSelection => ({ slug, media });

/** É contratável por WiFi Ads no planner? */
const wifiSelectable = (slug: string) =>
  campaignAvailableMediaTypes(bySlug.get(slug)!).includes("wifi");

test("regra de disponibilidade: 41 active selecionáveis, 6 temp + 2 unconfirmed não", () => {
  const active = catalog.filter((p) => wifiCampaignStatus(p) === "active");
  const temp = catalog.filter((p) => wifiCampaignStatus(p) === "temporarily_unavailable");
  const unconfirmed = catalog.filter((p) => wifiCampaignStatus(p) === "unconfirmed");

  assert.equal(active.length, 41);
  assert.equal(temp.length, 6);
  assert.equal(unconfirmed.length, 2);

  for (const p of active) assert.equal(wifiSelectable(p.slug), true, p.slug);
  for (const p of [...temp, ...unconfirmed]) assert.equal(wifiSelectable(p.slug), false, p.slug);

  // pointMediaTypes (estrutural) segue enxergando os 49 — não foi tocado.
  assert.equal(catalog.filter((p) => pointMediaTypes(p).includes("wifi")).length, 49);
});

test("novos pontos WiFi active são selecionáveis por WiFi Ads", () => {
  for (const slug of ["rodoviaria-interestadual", "hospital-sol-nascente", "na-hora-samambaia"]) {
    assert.equal(wifiCampaignStatus(bySlug.get(slug)!), "active", slug);
    assert.equal(wifiSelectable(slug), true, slug);
    const [detail] = getPlannerSelectionDetails([sel(slug, ["wifi"])]);
    assert.ok(detail, slug);
    assert.deepEqual(detail.media, ["wifi"]);
    assert.equal(detail.wifi?.status, "missing"); // sem métrica individual — não vira zero
    const proposal = buildPlannerProposal([detail], sim);
    assert.ok(proposal.includes(bySlug.get(slug)!.nome), slug);
    assert.match(proposal, /WiFi Ads/);
  }
});

test("os 6 temporarily_unavailable ficam fora do fluxo comercial mesmo se forçados", () => {
  for (const slug of [
    "terminal-de-sobradinho-ii",
    "feira-samambaia-2",
    "na-hora-brazlandia",
    "biblioteca-de-ceilandia",
    "ubs-05-arapoanga",
    "ubs-06-arapoanga",
  ]) {
    assert.equal(getPlannerSelectionDetails([sel(slug, ["wifi"])]).length, 0, slug);
    assert.equal(resolveWifiCpe(bySlug.get(slug)!), undefined, slug);
  }
});

test("os 2 unconfirmed nunca são contratáveis por WiFi", () => {
  for (const slug of ["rodoviaria-do-plano-piloto", "feira-dos-goianos"]) {
    assert.equal(wifiSelectable(slug), false, slug);
    assert.equal(getPlannerSelectionDetails([sel(slug, ["wifi"])]).length, 0, slug);
    assert.equal(resolveWifiCpe(bySlug.get(slug)!), undefined, slug);
  }
});

test("Biblioteca e UBS não quebram o planner nem a proposta", () => {
  const slugs = ["biblioteca-de-ceilandia", "ubs-05-arapoanga", "ubs-06-arapoanga"];
  // Ainda existem no catálogo (Bloco 2), só não oferecem mídia contratável.
  for (const slug of slugs) {
    assert.ok(bySlug.has(slug), slug);
    assert.deepEqual(campaignAvailableMediaTypes(bySlug.get(slug)!), []);
  }
  const details = getPlannerSelectionDetails(slugs.map((s) => sel(s, ["wifi"])));
  assert.deepEqual(details, []);
  assert.doesNotThrow(() => buildPlannerProposal(details, sim));
});

test("seleção mista Tela + WiFi: WiFi indisponível não bloqueia a Tela", () => {
  // upa-ceilandia: Tela + WiFi active → ambos contratáveis.
  const mixed = getPlannerSelectionDetails([sel("upa-ceilandia", ["screen", "wifi"])]);
  assert.deepEqual(mixed[0].media, ["screen", "wifi"]);

  // Ponto hipotético Tela + WiFi temporarily_unavailable: só a Tela sobrevive,
  // o ponto continua na campanha. (upa-sao-sebastiao tem Tela e nenhum WiFi —
  // serve de prova de que DOOH-only nunca depende de WiFi.)
  const doohOnly = getPlannerSelectionDetails([sel("upa-sao-sebastiao", ["screen", "wifi"])]);
  assert.deepEqual(doohOnly[0].media, ["screen"]);
  assert.equal(doohOnly[0].wifi, null);
  assert.ok(doohOnly[0].dooh); // audiência DOOH preservada
});

test("storage descarta WiFi que deixou de ser active, preservando o resto", () => {
  const withWindow = (run: () => void) => {
    const items = new Map<string, string>();
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        sessionStorage: {
          getItem: (k: string) => items.get(k) ?? null,
          setItem: (k: string, v: string) => items.set(k, v),
          removeItem: (k: string) => items.delete(k),
        },
      },
    });
    try {
      run();
    } finally {
      if (descriptor) Object.defineProperty(globalThis, "window", descriptor);
      else Reflect.deleteProperty(globalThis, "window");
    }
  };

  withWindow(() => {
    const stored: PlannerStoredState = {
      midia: "both",
      step: 2,
      sim,
      selections: [
        sel("biblioteca-de-ceilandia", ["wifi"]), // agora inválido → some
        sel("upa-ceilandia", ["screen", "wifi"]), // WiFi active → mantém os dois
        sel("upa-sao-sebastiao", ["screen", "wifi"]), // WiFi inexistente → sobra Tela
        sel("hospital-sol-nascente", ["wifi"]), // novo active → mantém
      ],
    };
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    const loaded = loadPlannerState()!;
    assert.deepEqual(loaded.selections, [
      sel("upa-ceilandia", ["screen", "wifi"]),
      sel("upa-sao-sebastiao", ["screen"]),
      sel("hospital-sol-nascente", ["wifi"]),
    ]);
    // round-trip estável
    savePlannerState(loaded);
    assert.deepEqual(loadPlannerState()!.selections, loaded.selections);
  });
});

test("proposta preserva novos pontos e não inventa audiência WiFi", () => {
  const details = getPlannerSelectionDetails([
    sel("rodoviaria-interestadual", ["wifi"]),
    sel("hospital-sol-nascente", ["wifi"]),
    sel("na-hora-samambaia", ["wifi"]),
    sel("terminal-brt-gama", ["led", "wifi"]),
  ]);
  assert.equal(details.length, 4);
  const proposal = buildPlannerProposal(details, sim);
  for (const slug of [
    "rodoviaria-interestadual",
    "hospital-sol-nascente",
    "na-hora-samambaia",
    "terminal-brt-gama",
  ]) {
    assert.ok(proposal.includes(bySlug.get(slug)!.nome), slug);
  }
  // RA da Rodoviária Interestadual = Plano Piloto (override do Bloco 1).
  assert.match(proposal, /Rodoviária Interestadual — Plano Piloto/);
  // WiFi entra sem métrica individual inventada.
  for (const d of details.filter((x) => x.media.includes("wifi")))
    assert.equal(d.wifi?.status, "missing", d.slug);
  // Sem número de acessos/leads/impacto WiFi fabricado nem contagem por ponto.
  assert.doesNotMatch(proposal, /\d[\d.]*\s*(acessos|leads|engajamentos|usuários)/i);
  assert.match(proposal, /sem conversão de inserções em acessos ou impactos/);
  assert.doesNotMatch(proposal, /undefined|null|NaN/);
});

test("CPE R$ 8,00 disponível no runtime para todos os 41 WiFi active", () => {
  const active = catalog.filter((p) => wifiCampaignStatus(p) === "active");
  for (const p of active) assert.equal(resolveWifiCpe(p), WIFI_CPE, p.slug);
  assert.equal(WIFI_CPE, 8);

  // Aparece na proposta como CPE unitário, sem total sem volume.
  const [detail] = getPlannerSelectionDetails([sel("na-hora-ceilandia", ["wifi"])]);
  const proposal = buildPlannerProposal([detail], sim);
  assert.match(proposal, /WiFi Ads — CPE: R\$\s?8,00/);
  assert.doesNotMatch(proposal, /Total .*WiFi|custo total/i);
});

test("contagens e slugs preservados", () => {
  assert.equal(catalog.length, 51);
  assert.equal(new Set(catalog.map((p) => p.slug)).size, 51);
  assert.deepEqual(
    networkPoints.map((c) => c.points.length),
    [11, 7, 11, 6, 6, 7, 1, 2],
  );
});
