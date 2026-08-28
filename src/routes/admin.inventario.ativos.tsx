import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AdminPanelsPage } from "@/components/admin/AdminPanelsPage";
import {
  DashboardLoading,
  DashboardRouteError,
} from "@/components/dashboard/post-purchase/DashboardQueryState";
import { adminPanelsQueryOptions } from "@/lib/admin/operations";
import { requireRole } from "@/lib/auth/functions";

export const Route = createFileRoute("/admin/inventario/ativos")({
  beforeLoad: () => requireRole({ data: { roles: ["admin", "operator"] } }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(adminPanelsQueryOptions(context.adminUser.id)),
  head: () => ({
    meta: [
      { title: "Ativos — Administração MOBTV" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  pendingComponent: () => <DashboardLoading label="Carregando painéis..." />,
  errorComponent: DashboardRouteError,
  component: AdminPanelsRoute,
});

function AdminPanelsRoute() {
  const { adminUser } = Route.useRouteContext();
  const initialData = Route.useLoaderData();
  return <AdminPanelsPage user={adminUser} initialData={initialData} />;
}
