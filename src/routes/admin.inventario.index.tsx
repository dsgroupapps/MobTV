import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AdminInventoryCalendarPage } from "@/components/admin/AdminInventoryCalendarPage";
import {
  DashboardLoading,
  DashboardRouteError,
} from "@/components/dashboard/post-purchase/DashboardQueryState";
import { adminPanelsQueryOptions } from "@/lib/admin/operations";
import { requireRole } from "@/lib/auth/functions";

export const Route = createFileRoute("/admin/inventario/")({
  beforeLoad: () => requireRole({ data: { roles: ["admin", "operator"] } }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(adminPanelsQueryOptions(context.adminUser.id)),
  head: () => ({
    meta: [
      { title: "Inventário — Administração MOBTV" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  pendingComponent: () => <DashboardLoading label="Carregando inventário..." />,
  errorComponent: DashboardRouteError,
  component: AdminInventoryRoute,
});

function AdminInventoryRoute() {
  const { adminUser } = Route.useRouteContext();
  const initialData = Route.useLoaderData();
  const { data } = useQuery({ ...adminPanelsQueryOptions(adminUser.id), initialData });
  return <AdminInventoryCalendarPage user={adminUser} panels={data} />;
}
