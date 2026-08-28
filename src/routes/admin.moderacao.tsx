import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AdminModerationPage } from "@/components/admin/AdminModerationPage";
import {
  DashboardLoading,
  DashboardRouteError,
} from "@/components/dashboard/post-purchase/DashboardQueryState";
import { adminModerationQueryOptions } from "@/lib/admin/moderation";
import { requireRole } from "@/lib/auth/functions";

export const Route = createFileRoute("/admin/moderacao")({
  beforeLoad: () => requireRole({ data: { roles: ["admin", "operator"] } }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(adminModerationQueryOptions(context.adminUser.id)),
  head: () => ({
    meta: [
      { title: "Moderação — Administração MOBTV" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  pendingComponent: () => <DashboardLoading label="Carregando fila de moderação..." />,
  errorComponent: DashboardRouteError,
  component: AdminModerationRoute,
});

function AdminModerationRoute() {
  const { adminUser } = Route.useRouteContext();
  const initialData = Route.useLoaderData();
  return <AdminModerationPage user={adminUser} initialData={initialData} />;
}
