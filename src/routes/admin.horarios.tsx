import { createFileRoute } from "@tanstack/react-router";

import { AdminHoursPage } from "@/components/admin/AdminHoursPage";
import {
  DashboardLoading,
  DashboardRouteError,
} from "@/components/dashboard/post-purchase/DashboardQueryState";
import { adminPanelHoursQueryOptions } from "@/lib/admin/operations";
import { requireRole } from "@/lib/auth/functions";

export const Route = createFileRoute("/admin/horarios")({
  beforeLoad: () => requireRole({ data: { roles: ["admin", "operator"] } }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(adminPanelHoursQueryOptions(context.adminUser.id)),
  head: () => ({
    meta: [
      { title: "Horários — Administração MOBTV" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  pendingComponent: () => <DashboardLoading label="Carregando horários..." />,
  errorComponent: DashboardRouteError,
  component: AdminHoursRoute,
});

function AdminHoursRoute() {
  const { adminUser } = Route.useRouteContext();
  const initialData = Route.useLoaderData();
  return <AdminHoursPage user={adminUser} initialData={initialData} />;
}
