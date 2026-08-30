import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";

import { useAssetSignedUrl } from "@/hooks/useAssetSignedUrl";
import {
  filterActivePaidAssets,
  getPlayerClock,
  selectPlayerContent,
  type PlayerFillerAsset,
  type PlayerPaidAsset,
} from "@/lib/player/content";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

type Panel = {
  id: string;
  name: string;
  address: string;
  timezone: string;
};

type PaidAssetQueryRow = {
  id: string;
  storage_url: string | null;
  type: string;
  duration_seconds: number;
  order_items: {
    id: string;
    date: string;
    start_time: string;
  };
};

export function PanelPlayer({ panelId }: { panelId: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playCycle, setPlayCycle] = useState(0);
  const panelQuery = useQuery({
    queryKey: ["panel-player", panelId],
    queryFn: async (): Promise<Panel> => {
      const { data, error } = await getBrowserSupabaseClient()
        .from("panels")
        .select("id,name,address,timezone")
        .eq("id", panelId)
        .single();
      if (error) throw error;
      return data;
    },
    refetchInterval: 60_000,
  });

  const timezone = panelQuery.data?.timezone ?? "America/Sao_Paulo";
  const clock = getPlayerClock(new Date(), timezone);
  const assetsQuery = useQuery({
    queryKey: ["panel-player-assets", panelId, clock.date],
    queryFn: async (): Promise<PlayerPaidAsset[]> => {
      const { data, error } = await getBrowserSupabaseClient()
        .from("assets")
        .select(
          "id,storage_url,type,duration_seconds,order_items!inner(id,panel_id,date,start_time,orders!inner(status))",
        )
        .eq("order_items.panel_id", panelId)
        .eq("status", "approved")
        .eq("order_items.orders.status", "paid")
        .eq("order_items.date", clock.date);
      if (error) throw error;
      const candidates = ((data ?? []) as unknown as PaidAssetQueryRow[]).map((asset) => ({
        id: asset.id,
        storagePath: asset.storage_url,
        type: asset.type,
        durationSeconds: asset.duration_seconds,
        scheduledDate: asset.order_items.date,
        startTime: asset.order_items.start_time,
        orderItemId: asset.order_items.id,
      }));
      return filterActivePaidAssets(candidates, getPlayerClock(new Date(), timezone));
    },
    refetchInterval: 10_000,
    enabled: Boolean(panelId),
  });

  const fillerQuery = useQuery({
    queryKey: ["panel-player-filler", panelId],
    queryFn: async (): Promise<PlayerFillerAsset[]> => {
      const { data, error } = await getBrowserSupabaseClient()
        .from("filler_media")
        .select("id,storage_url,type,duration_seconds,panel_ids")
        .eq("active", true)
        .order("created_at");
      if (error) throw error;
      return (data ?? []).map((asset) => ({
        id: asset.id,
        storagePath: asset.storage_url,
        type: asset.type,
        durationSeconds: asset.duration_seconds,
        panelIds: asset.panel_ids ?? [],
      }));
    },
    enabled: assetsQuery.isSuccess && assetsQuery.data.length === 0,
    refetchInterval: 30_000,
  });

  const displayContent = useMemo(
    () =>
      selectPlayerContent(
        assetsQuery.data ?? [],
        fillerQuery.data ?? [],
        panelId,
        getPlayerClock(new Date(), timezone),
      ),
    [assetsQuery.data, fillerQuery.data, panelId, timezone],
  );
  const currentAsset = displayContent[currentIndex] ?? null;
  const { signedUrl, loading: urlLoading } = useAssetSignedUrl(
    currentAsset?.storagePath ?? null,
    7_200,
  );

  useEffect(() => {
    if (currentIndex >= displayContent.length) setCurrentIndex(0);
  }, [currentIndex, displayContent.length]);

  useEffect(() => {
    if (!currentAsset || !signedUrl) return;
    const timer = window.setTimeout(
      () => {
        if (currentAsset.source === "paid") {
          void getBrowserSupabaseClient().from("opp_logs").insert({
            panel_id: panelId,
            asset_id: currentAsset.id,
            played_at: new Date().toISOString(),
            duration_seconds: currentAsset.durationSeconds,
            status: "success",
            latency_ms: 0,
          });
        }
        setCurrentIndex((index) =>
          displayContent.length > 1 ? (index + 1) % displayContent.length : 0,
        );
        setPlayCycle((cycle) => cycle + 1);
      },
      Math.max(1, currentAsset.durationSeconds) * 1_000,
    );
    return () => window.clearTimeout(timer);
  }, [currentAsset, displayContent.length, panelId, playCycle, signedUrl]);

  if (panelQuery.isLoading) return <PlayerMessage message="Carregando painel..." />;
  if (panelQuery.isError || !panelQuery.data)
    return <PlayerMessage message="Painel não encontrado" />;
  if (assetsQuery.isLoading || (assetsQuery.data?.length === 0 && fillerQuery.isLoading))
    return <PlayerMessage message="Carregando conteúdo..." />;
  if (assetsQuery.isError || fillerQuery.isError)
    return <PlayerMessage message="Não foi possível carregar a programação" />;
  if (!currentAsset)
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-navy px-8 text-center text-white">
        <h1 className="font-display text-4xl font-bold sm:text-6xl">{panelQuery.data.name}</h1>
        <p className="mt-3 text-lg text-white/75 sm:text-2xl">{panelQuery.data.address}</p>
        <p className="mt-8 text-base text-white/55 sm:text-xl">Aguardando conteúdo...</p>
      </div>
    );
  if (urlLoading || !signedUrl) return <PlayerMessage message="Preparando mídia..." loading />;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      {currentAsset.type.startsWith("image") ? (
        <img src={signedUrl} alt="Anúncio" className="h-full w-full object-contain" />
      ) : (
        <video
          key={currentAsset.id}
          src={signedUrl}
          className="h-full w-full object-contain"
          autoPlay
          muted
          playsInline
          loop={displayContent.length === 1}
        >
          <track kind="captions" />
        </video>
      )}
      {displayContent.length > 1 && (
        <div className="absolute bottom-4 right-4 rounded-md bg-black/60 px-3 py-2 text-xs text-white">
          {currentIndex + 1} / {displayContent.length}
        </div>
      )}
    </div>
  );
}

function PlayerMessage({ message, loading = false }: { message: string; loading?: boolean }) {
  return (
    <div className="flex h-screen w-screen items-center justify-center gap-3 bg-black px-6 text-center text-xl text-white sm:text-2xl">
      {loading && <LoaderCircle className="h-7 w-7 animate-spin text-white/55" aria-hidden />}
      {message}
    </div>
  );
}
