import "../test-support.ts";
import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getPointIntelligence, rollupCampaignAudience } from "./index.ts";

const { PointAudiencePanel } = await import("../../../components/site/PointAudiencePanel.tsx");
const { CampaignAudienceSummary } =
  await import("../../../components/site/CampaignAudienceSummary.tsx");

test("cards BRT LED/Tela publicados mostram referência do ponto, ressalva e 2024", () => {
  for (const slug of ["terminal-brt-gama", "terminal-brt-santa-maria"]) {
    for (const media of ["led", "screen"] as const) {
      const intelligence = getPointIntelligence(slug, [media])!;
      const html = renderToStaticMarkup(
        createElement(PointAudiencePanel, { intelligence, pointName: slug }),
      );
      assert.match(html, /Impactos mensais de referência do ponto/);
      assert.match(html, /Medido e auditado/);
      assert.match(html, /2024/);
      assert.match(html, /Não representa uma auditoria individual do monitor/);
      assert.doesNotMatch(html, /Estimativa modelada|sourceQuality|environment_reference/);
    }
  }
});

test("UI de saúde separa atividade observada e estimativa preliminar sem termos internos", () => {
  for (const slug of ["upa-ceilandia", "hospital-regional-de-santa-maria"]) {
    const intelligence = getPointIntelligence(slug, ["screen"])!;
    const html = renderToStaticMarkup(
      createElement(PointAudiencePanel, { intelligence, pointName: slug }),
    );
    assert.match(html, /Impactos potenciais estimados/);
    assert.match(html, /Estimativa preliminar MOBTV/);
    assert.match(html, /Atividade assistencial de referência/);
    assert.match(html, /Base observada/);
    assert.match(html, /Como calculamos/);
    assert.doesNotMatch(
      html,
      /Medido e auditado|Base de circulação|piso conservador|modelConfidence|sourceQuality|modeled_impressions|derived/,
    );
    const rollup = rollupCampaignAudience([{ slug, name: slug, intelligence }]);
    const summary = renderToStaticMarkup(
      createElement(CampaignAudienceSummary, {
        rollup,
        sim: { days: 15, insertionsPerDay: 120 },
      }),
    );
    assert.match(summary, /estimativas preliminares MOBTV/);
    assert.doesNotMatch(summary, /medido e auditado/);
  }
});
