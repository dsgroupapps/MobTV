import { createFileRoute } from "@tanstack/react-router";

import { AdminBlackoutsPage } from "@/components/admin/AdminBlackoutsPage";
import {
  DashboardLoading,
  DashboardRouteError,
} from "@/components/dashboard/post-purchase/DashboardQueryState";
import { adminBlackoutsQueryOptions } from "@/lib/admin/operations";
import { requireRole } from "@/lib/auth/functions";

export const Route = createFileRoute("/admin/bloqueios")({
  beforeLoad: () => requireRole({ data: { roles: ["admin", "operator"] } }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(adminBlackoutsQueryOptions(context.adminUser.id)),
  head: () => ({
    meta: [
      { title: "Bloqueios — Administração MOBTV" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  pendingComponent: () => <DashboardLoading label="Carregando bloqueios..." />,
  errorComponent: DashboardRouteError,
  component: AdminBlackoutsRoute,
});

function AdminBlackoutsRoute() {
  const { adminUser } = Route.useRouteContext();
  const initialData = Route.useLoaderData();
  return <AdminBlackoutsPage user={adminUser} initialData={initialData} />;
}
