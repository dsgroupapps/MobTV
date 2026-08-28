import { createFileRoute } from "@tanstack/react-router";

import { CampaignReviewPage } from "@/components/dashboard/campaign/CampaignReviewPage";

export const Route = createFileRoute("/dashboard/campanhas/nova/revisao")({
  head: () => ({
    meta: [
      { title: "Revisar campanha — Área do anunciante MOBTV" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CampaignReviewPage,
});
