import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AdminUsersPage } from "@/components/admin/AdminUsersPage";
import {
  DashboardLoading,
  DashboardRouteError,
} from "@/components/dashboard/post-purchase/DashboardQueryState";
import { requireRole } from "@/lib/auth/functions";
import { adminUsersQueryOptions } from "@/lib/admin/users";

export const Route = createFileRoute("/admin/usuarios")({
  beforeLoad: () => requireRole({ data: { roles: ["admin"] } }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(adminUsersQueryOptions(context.adminUser.id)),
  head: () => ({
    meta: [
      { title: "Usuários — Administração MOBTV" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  pendingComponent: () => <DashboardLoading label="Carregando usuários..." />,
  errorComponent: DashboardRouteError,
  component: AdminUsersRoute,
});

function AdminUsersRoute() {
  const { adminUser } = Route.useRouteContext();
  const initialData = Route.useLoaderData();
  const { data } = useQuery({ ...adminUsersQueryOptions(adminUser.id), initialData });
  return <AdminUsersPage data={data} />;
}
