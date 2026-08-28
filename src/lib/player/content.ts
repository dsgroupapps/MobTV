export type PlayerClock = { date: string; seconds: number };

export type PlayerPaidAsset = {
  id: string;
  storagePath: string | null;
  type: string;
  durationSeconds: number;
  scheduledDate: string;
  startTime: string;
  orderItemId: string;
};

export type PlayerFillerAsset = {
  id: string;
  storagePath: string;
  type: string;
  durationSeconds: number;
  panelIds: string[];
};

export type PlayerContent =
  (PlayerPaidAsset & { source: "paid" }) | (PlayerFillerAsset & { source: "filler" });

function timeToSeconds(time: string): number {
  const [hours = 0, minutes = 0, seconds = 0] = time.split(":").map(Number);
  return hours * 3_600 + minutes * 60 + seconds;
}

export function getPlayerClock(now: Date, timezone: string): PlayerClock {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";
  const date = `${value("year")}-${value("month")}-${value("day")}`;
  const seconds =
    Number(value("hour")) * 3_600 + Number(value("minute")) * 60 + Number(value("second"));
  return { date, seconds };
}

export function selectPlayerContent(
  paidAssets: PlayerPaidAsset[],
  fillerAssets: PlayerFillerAsset[],
  panelId: string,
  clock: PlayerClock,
): PlayerContent[] {
  const activePaid = filterActivePaidAssets(paidAssets, clock);

  if (activePaid.length > 0) {
    return activePaid.map((asset) => ({ ...asset, source: "paid" as const }));
  }

  return fillerAssets
    .filter((asset) => asset.panelIds.length === 0 || asset.panelIds.includes(panelId))
    .map((asset) => ({ ...asset, source: "filler" as const }));
}

export function filterActivePaidAssets(
  paidAssets: PlayerPaidAsset[],
  clock: PlayerClock,
): PlayerPaidAsset[] {
  return paidAssets.filter((asset) => {
    const start = timeToSeconds(asset.startTime);
    return (
      asset.scheduledDate === clock.date &&
      clock.seconds >= start &&
      clock.seconds < start + asset.durationSeconds
    );
  });
}
