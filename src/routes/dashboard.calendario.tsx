import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";

import { DashboardPlaceholder } from "@/components/dashboard/DashboardPlaceholder";

export const Route = createFileRoute("/dashboard/calendario")({
  head: () => ({
    meta: [
      { title: "Calendário — Área do anunciante MOBTV" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CalendarPage,
});

function CalendarPage() {
  return (
    <DashboardPlaceholder
      icon={CalendarDays}
      eyebrow="Calendário"
      title="Calendário"
      description="A visualização consolidada das veiculações será adicionada nesta área mantendo as reservas atuais."
    />
  );
}
