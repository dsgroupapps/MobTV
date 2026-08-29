import { createFileRoute, redirect } from "@tanstack/react-router";

import { requireRole } from "@/lib/auth/functions";

export const Route = createFileRoute("/admin/midias/")({
  beforeLoad: async () => {
    await requireRole({ data: { roles: ["admin"] } });
    throw redirect({ to: "/admin/midias/filler" });
  },
});
