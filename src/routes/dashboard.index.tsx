import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AdvertiserDashboard } from "@/components/dashboard/AdvertiserDashboard";
import { advertiserDashboardQueryOptions } from "@/lib/dashboard/advertiser-dashboard";

export const Route = createFileRoute("/dashboard/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(advertiserDashboardQueryOptions(context.advertiserUser.id)),
  head: () => ({
    meta: [
      { title: "Visão geral — Área do anunciante MOBTV" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DashboardOverviewPage,
});

function DashboardOverviewPage() {
  const { advertiserUser } = Route.useRouteContext();
  const initialData = Route.useLoaderData();
  const { data } = useQuery({
    ...advertiserDashboardQueryOptions(advertiserUser.id),
    initialData,
  });

  return <AdvertiserDashboard userName={advertiserUser.name} data={data} />;
}
