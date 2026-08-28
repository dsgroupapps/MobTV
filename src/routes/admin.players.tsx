import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AdminPlayersPage } from "@/components/admin/AdminPlayersPage";
import {
  DashboardLoading,
  DashboardRouteError,
} from "@/components/dashboard/post-purchase/DashboardQueryState";
import { adminPlayersQueryOptions } from "@/lib/admin/players";
import { requireRole } from "@/lib/auth/functions";

export const Route = createFileRoute("/admin/players")({
  beforeLoad: () => requireRole({ data: { roles: ["admin", "operator"] } }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(adminPlayersQueryOptions(context.adminUser.id)),
  head: () => ({
    meta: [
      { title: "Players — Administração MOBTV" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  pendingComponent: () => <DashboardLoading label="Carregando players..." />,
  errorComponent: DashboardRouteError,
  component: AdminPlayersRoute,
});

function AdminPlayersRoute() {
  const { adminUser } = Route.useRouteContext();
  const initialData = Route.useLoaderData();
  const { data } = useQuery({ ...adminPlayersQueryOptions(adminUser.id), initialData });
  return <AdminPlayersPage players={data} />;
}
