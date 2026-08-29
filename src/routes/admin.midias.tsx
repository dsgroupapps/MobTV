import { Outlet, createFileRoute } from "@tanstack/react-router";

import { requireRole } from "@/lib/auth/functions";

export const Route = createFileRoute("/admin/midias")({
  beforeLoad: () => requireRole({ data: { roles: ["admin"] } }),
  component: Outlet,
});
