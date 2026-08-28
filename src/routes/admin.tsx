import { Outlet, createFileRoute } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin/AdminShell";
import { requireRole } from "@/lib/auth/functions";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const adminUser = await requireRole({ data: { roles: ["admin", "operator"] } });
    return { adminUser };
  },
  head: () => ({
    meta: [
      { title: "Área administrativa — MOBTV" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { adminUser } = Route.useRouteContext();
  return (
    <AdminShell user={adminUser}>
      <Outlet />
    </AdminShell>
  );
}
