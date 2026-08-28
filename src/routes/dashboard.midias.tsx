import { createFileRoute } from "@tanstack/react-router";
import { Film } from "lucide-react";

import { DashboardPlaceholder } from "@/components/dashboard/DashboardPlaceholder";

export const Route = createFileRoute("/dashboard/midias")({
  head: () => ({
    meta: [
      { title: "Mídias — Área do anunciante MOBTV" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: MediaPage,
});

function MediaPage() {
  return (
    <DashboardPlaceholder
      icon={Film}
      eyebrow="Mídias"
      title="Mídias"
      description="A biblioteca de arquivos e os estados de moderação serão detalhados nesta rota em uma próxima etapa."
    />
  );
}
