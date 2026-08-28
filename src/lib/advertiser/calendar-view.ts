import { addMinutes, startOfDay } from "date-fns";

import type { AdvertiserCalendarReservation } from "./types";

export function generateCalendarTimeSlots(date: Date): Date[] {
  const slots: Date[] = [];
  const start = startOfDay(date);
  for (let minute = 0; minute < 24 * 60; minute += 30) {
    slots.push(addMinutes(start, minute));
  }
  return slots;
}

export function reservationsForCalendarSlot(
  slotTime: Date,
  reservations: AdvertiserCalendarReservation[],
): AdvertiserCalendarReservation[] {
  const slotTotalSeconds = slotTime.getHours() * 3_600 + slotTime.getMinutes() * 60;
  return reservations.filter((reservation) => {
    const [startHour, startMinute, startSecond] = reservation.startTime.split(":").map(Number);
    const startTotalSeconds = startHour * 3_600 + startMinute * 60 + startSecond;
    return (
      slotTotalSeconds >= startTotalSeconds &&
      slotTotalSeconds < startTotalSeconds + reservation.durationSeconds
    );
  });
}
