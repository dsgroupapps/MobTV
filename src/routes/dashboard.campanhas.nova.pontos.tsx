import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { PanelSelectionPage } from "@/components/dashboard/campaign/PanelSelectionPage";
import { campaignInventoryQueryOptions } from "@/lib/campaign/functions";

export const Route = createFileRoute("/dashboard/campanhas/nova/pontos")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(campaignInventoryQueryOptions(context.advertiserUser.id)),
  head: () => ({
    meta: [
      { title: "Selecionar painéis — Área do anunciante MOBTV" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CampaignPanelsRoute,
});

function CampaignPanelsRoute() {
  const { advertiserUser } = Route.useRouteContext();
  const initialData = Route.useLoaderData();
  const { data } = useQuery({
    ...campaignInventoryQueryOptions(advertiserUser.id),
    initialData,
  });
  return <PanelSelectionPage panels={data} />;
}
