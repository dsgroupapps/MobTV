import { createFileRoute } from "@tanstack/react-router";

import { PanelPlayer } from "@/components/player/PanelPlayer";

export const Route = createFileRoute("/player/$panelId")({
  head: () => ({
    meta: [{ title: "Player MOBTV" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: PlayerRoute,
});

function PlayerRoute() {
  const { panelId } = Route.useParams();
  return <PanelPlayer panelId={panelId} />;
}
