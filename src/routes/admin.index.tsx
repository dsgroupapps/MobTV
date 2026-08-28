import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AdminDashboardPage } from "@/components/admin/AdminDashboardPage";
import {
  DashboardLoading,
  DashboardRouteError,
} from "@/components/dashboard/post-purchase/DashboardQueryState";
import { adminDashboardQueryOptions } from "@/lib/admin/dashboard";

export const Route = createFileRoute("/admin/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(adminDashboardQueryOptions(context.adminUser.id)),
  head: () => ({
    meta: [
      { title: "Visão geral — Administração MOBTV" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  pendingComponent: () => <DashboardLoading label="Carregando administração..." />,
  errorComponent: DashboardRouteError,
  component: AdminIndexRoute,
});

function AdminIndexRoute() {
  const { adminUser } = Route.useRouteContext();
  const initialData = Route.useLoaderData();
  const { data } = useQuery({ ...adminDashboardQueryOptions(adminUser.id), initialData });
  return <AdminDashboardPage data={data} canManage={adminUser.roles.includes("admin")} />;
}
