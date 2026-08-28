import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { AdminCampaignsPage } from "@/components/admin/AdminCampaignsPage";
import {
  DashboardLoading,
  DashboardRouteError,
} from "@/components/dashboard/post-purchase/DashboardQueryState";
import { adminCampaignFiltersQueryOptions } from "@/lib/admin/campaigns";

const searchSchema = z.object({ user: z.string().uuid().optional().catch(undefined) });

export const Route = createFileRoute("/admin/campanhas/")({
  validateSearch: searchSchema,
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(adminCampaignFiltersQueryOptions(context.adminUser.id)),
  head: () => ({
    meta: [
      { title: "Campanhas — Administração MOBTV" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  pendingComponent: () => <DashboardLoading label="Carregando campanhas..." />,
  errorComponent: DashboardRouteError,
  component: AdminCampaignsRoute,
});

function AdminCampaignsRoute() {
  const { adminUser } = Route.useRouteContext();
  const { user } = Route.useSearch();
  const initialData = Route.useLoaderData();
  const { data } = useQuery({
    ...adminCampaignFiltersQueryOptions(adminUser.id),
    initialData,
  });
  return <AdminCampaignsPage user={adminUser} filters={data} initialUserId={user} />;
}
