import { createFileRoute } from "@tanstack/react-router";

import { AdminPricingPage } from "@/components/admin/AdminPricingPage";
import {
  DashboardLoading,
  DashboardRouteError,
} from "@/components/dashboard/post-purchase/DashboardQueryState";
import { adminPricingRulesQueryOptions } from "@/lib/admin/operations";
import { requireRole } from "@/lib/auth/functions";

export const Route = createFileRoute("/admin/precos")({
  beforeLoad: () => requireRole({ data: { roles: ["admin", "operator"] } }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(adminPricingRulesQueryOptions(context.adminUser.id)),
  head: () => ({
    meta: [
      { title: "Preços — Administração MOBTV" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  pendingComponent: () => <DashboardLoading label="Carregando preços..." />,
  errorComponent: DashboardRouteError,
  component: AdminPricingRoute,
});

function AdminPricingRoute() {
  const { adminUser } = Route.useRouteContext();
  const initialData = Route.useLoaderData();
  return <AdminPricingPage user={adminUser} initialData={initialData} />;
}
