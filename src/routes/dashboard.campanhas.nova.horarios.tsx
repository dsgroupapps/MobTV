import { createFileRoute } from "@tanstack/react-router";

import { TimeSlotSelectionPage } from "@/components/dashboard/campaign/TimeSlotSelectionPage";

export const Route = createFileRoute("/dashboard/campanhas/nova/horarios")({
  head: () => ({
    meta: [
      { title: "Selecionar horários — Área do anunciante MOBTV" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: TimeSlotSelectionPage,
});
