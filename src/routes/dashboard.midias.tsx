import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import {
  DashboardLoading,
  DashboardRouteError,
} from "@/components/dashboard/post-purchase/DashboardQueryState";
import { MediaLibraryPage } from "@/components/dashboard/post-purchase/MediaLibraryPage";
import { advertiserAssetsQueryOptions } from "@/lib/advertiser/media";

export const Route = createFileRoute("/dashboard/midias")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(advertiserAssetsQueryOptions(context.advertiserUser.id)),
  head: () => ({
    meta: [
      { title: "Mídias — Área do anunciante MOBTV" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  pendingComponent: () => <DashboardLoading label="Carregando mídias..." />,
  errorComponent: DashboardRouteError,
  component: MediaRoute,
});

function MediaRoute() {
  const { advertiserUser } = Route.useRouteContext();
  const initialData = Route.useLoaderData();
  const { data } = useQuery({
    ...advertiserAssetsQueryOptions(advertiserUser.id),
    initialData,
  });
  return <MediaLibraryPage assets={data} />;
}
