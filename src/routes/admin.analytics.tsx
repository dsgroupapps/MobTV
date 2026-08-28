import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AdminAnalyticsPage } from "@/components/admin/AdminAnalyticsPage";
import {
  DashboardLoading,
  DashboardRouteError,
} from "@/components/dashboard/post-purchase/DashboardQueryState";
import { adminAnalyticsQueryOptions } from "@/lib/admin/analytics";
import { requireRole } from "@/lib/auth/functions";

export const Route = createFileRoute("/admin/analytics")({
  beforeLoad: () => requireRole({ data: { roles: ["admin", "operator"] } }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(adminAnalyticsQueryOptions(context.adminUser.id)),
  head: () => ({
    meta: [
      { title: "Analytics — Administração MOBTV" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  pendingComponent: () => <DashboardLoading label="Carregando analytics..." />,
  errorComponent: DashboardRouteError,
  component: AdminAnalyticsRoute,
});

function AdminAnalyticsRoute() {
  const { adminUser } = Route.useRouteContext();
  const initialData = Route.useLoaderData();
  const { data } = useQuery({ ...adminAnalyticsQueryOptions(adminUser.id), initialData });
  return <AdminAnalyticsPage data={data} />;
}
