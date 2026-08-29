import { createFileRoute } from "@tanstack/react-router";

import { AdminFillerMediaPage } from "@/components/admin/AdminFillerMediaPage";
import {
  DashboardLoading,
  DashboardRouteError,
} from "@/components/dashboard/post-purchase/DashboardQueryState";
import { adminFillerQueryOptions } from "@/lib/admin/filler";
import { requireRole } from "@/lib/auth/functions";

export const Route = createFileRoute("/admin/midias/filler")({
  beforeLoad: () => requireRole({ data: { roles: ["admin"] } }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(adminFillerQueryOptions(context.adminUser.id)),
  head: () => ({
    meta: [
      { title: "Mídias filler — Administração MOBTV" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  pendingComponent: () => <DashboardLoading label="Carregando mídias filler..." />,
  errorComponent: DashboardRouteError,
  component: AdminFillerRoute,
});

function AdminFillerRoute() {
  const { adminUser } = Route.useRouteContext();
  const initialData = Route.useLoaderData();
  return <AdminFillerMediaPage user={adminUser} initialData={initialData} />;
}
