import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AdminCampaignCreatePage } from "@/components/admin/AdminCampaignCreatePage";
import {
  DashboardLoading,
  DashboardRouteError,
} from "@/components/dashboard/post-purchase/DashboardQueryState";
import { adminCampaignCreationQueryOptions } from "@/lib/admin/campaigns";
import { requireRole } from "@/lib/auth/functions";

export const Route = createFileRoute("/admin/campanhas/nova")({
  beforeLoad: () => requireRole({ data: { roles: ["admin"] } }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(adminCampaignCreationQueryOptions(context.adminUser.id)),
  head: () => ({
    meta: [
      { title: "Criar campanha — Administração MOBTV" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  pendingComponent: () => <DashboardLoading label="Carregando criação de campanha..." />,
  errorComponent: DashboardRouteError,
  component: AdminCampaignCreateRoute,
});

function AdminCampaignCreateRoute() {
  const { adminUser } = Route.useRouteContext();
  const initialData = Route.useLoaderData();
  const { data } = useQuery({
    ...adminCampaignCreationQueryOptions(adminUser.id),
    initialData,
  });
  return <AdminCampaignCreatePage adminUserId={adminUser.id} data={data} />;
}
