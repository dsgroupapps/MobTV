import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import {
  DashboardLoading,
  DashboardRouteError,
} from "@/components/dashboard/post-purchase/DashboardQueryState";
import { OrdersCalendarPage } from "@/components/dashboard/post-purchase/OrdersCalendarPage";
import { advertiserCalendarPanelsQueryOptions } from "@/lib/advertiser/calendar";

export const Route = createFileRoute("/dashboard/calendario")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(
      advertiserCalendarPanelsQueryOptions(context.advertiserUser.id),
    ),
  head: () => ({
    meta: [
      { title: "Calendário — Área do anunciante MOBTV" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  pendingComponent: () => <DashboardLoading label="Carregando calendário..." />,
  errorComponent: DashboardRouteError,
  component: CalendarRoute,
});

function CalendarRoute() {
  const { advertiserUser } = Route.useRouteContext();
  const initialData = Route.useLoaderData();
  const { data } = useQuery({
    ...advertiserCalendarPanelsQueryOptions(advertiserUser.id),
    initialData,
  });
  return <OrdersCalendarPage userId={advertiserUser.id} panels={data} />;
}
