import { createFileRoute } from "@tanstack/react-router";

import { CampaignSetupPage } from "@/components/dashboard/campaign/CampaignSetupPage";

export const Route = createFileRoute("/dashboard/campanhas/nova/")({
  head: () => ({
    meta: [
      { title: "Criar campanha — Área do anunciante MOBTV" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CampaignSetupPage,
});
