import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { requireRole } from "@/lib/auth/functions";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const advertiserUser = await requireRole({ data: { roles: ["advertiser"] } });
    if (advertiserUser.role !== "advertiser") throw redirect({ href: "/admin" });
    return { advertiserUser };
  },
  head: () => ({
    meta: [
      { title: "Área do anunciante — MOBTV" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { advertiserUser } = Route.useRouteContext();
  return (
    <DashboardShell user={advertiserUser}>
      <Outlet />
    </DashboardShell>
  );
}
