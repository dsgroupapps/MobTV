import { Outlet, createFileRoute } from "@tanstack/react-router";

import { requireRole } from "@/lib/auth/functions";

export const Route = createFileRoute("/admin/inventario")({
  beforeLoad: () => requireRole({ data: { roles: ["admin", "operator"] } }),
  component: Outlet,
});
