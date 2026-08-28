import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { CampaignsPage } from "@/components/dashboard/post-purchase/CampaignsPage";
import {
  DashboardLoading,
  DashboardRouteError,
} from "@/components/dashboard/post-purchase/DashboardQueryState";
import { advertiserCampaignsQueryOptions } from "@/lib/advertiser/campaigns";

export const Route = createFileRoute("/dashboard/campanhas/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(advertiserCampaignsQueryOptions(context.advertiserUser.id)),
  head: () => ({
    meta: [
      { title: "Campanhas — Área do anunciante MOBTV" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  pendingComponent: () => <DashboardLoading label="Carregando campanhas..." />,
  errorComponent: DashboardRouteError,
  component: CampaignsRoute,
});

function CampaignsRoute() {
  const { advertiserUser } = Route.useRouteContext();
  const initialData = Route.useLoaderData();
  const { data } = useQuery({
    ...advertiserCampaignsQueryOptions(advertiserUser.id),
    initialData,
  });
  return <CampaignsPage data={data} />;
}
