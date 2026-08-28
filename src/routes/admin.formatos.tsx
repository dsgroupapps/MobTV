import { createFileRoute } from "@tanstack/react-router";

import { AdminFormatsPage } from "@/components/admin/AdminFormatsPage";
import {
  DashboardLoading,
  DashboardRouteError,
} from "@/components/dashboard/post-purchase/DashboardQueryState";
import { adminPanelFormatsQueryOptions } from "@/lib/admin/operations";
import { requireRole } from "@/lib/auth/functions";

export const Route = createFileRoute("/admin/formatos")({
  beforeLoad: () => requireRole({ data: { roles: ["admin", "operator"] } }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(adminPanelFormatsQueryOptions(context.adminUser.id)),
  head: () => ({
    meta: [
      { title: "Formatos — Administração MOBTV" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  pendingComponent: () => <DashboardLoading label="Carregando formatos..." />,
  errorComponent: DashboardRouteError,
  component: AdminFormatsRoute,
});

function AdminFormatsRoute() {
  const { adminUser } = Route.useRouteContext();
  const initialData = Route.useLoaderData();
  return <AdminFormatsPage user={adminUser} initialData={initialData} />;
}
