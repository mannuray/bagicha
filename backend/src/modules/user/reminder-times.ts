import type { ReminderSlot } from '@prisma/client';

/** Minutes between reminder times a gardener can pick. */
export const REMINDER_STEP = 15;

/**
 * When each reminder may go out, in minutes after midnight IST. Mornings start
 * at 06:00 so the 05:00 weather run has added the day's weather tasks; both
 * ranges keep buzzes out of the night.
 */
export const REMINDER_RANGES: Record<
  ReminderSlot,
  { min: number; max: number; default: number }
> = {
  MORNING: { min: 360, max: 705, default: 420 },
  EVENING: { min: 900, max: 1305, default: 1080 },
};

/** Every time a slot can be set to. */
export function allowedMinutes(slot: ReminderSlot): number[] {
  const { min, max } = REMINDER_RANGES[slot];
  const out: number[] = [];
  for (let m = min; m <= max; m += REMINDER_STEP) out.push(m);
  return out;
}

// India keeps one offset all year (no daylight saving), so plain arithmetic is exact.
const IST_OFFSET_MS = 330 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const shiftDate = (date: string, days: number) =>
  isoDay(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS);

/** The IST calendar date and the IST quarter-hour (minutes after midnight) that `now` falls in. */
export function istQuarter(now: Date): { istDate: string; minute: number } {
  const ist = now.getTime() + IST_OFFSET_MS;
  const minuteOfDay = Math.floor((ist % DAY_MS) / 60_000);
  return {
    istDate: isoDay(ist),
    minute: minuteOfDay - (minuteOfDay % REMINDER_STEP),
  };
}

/** The IST dates a reminder counts: overdue up to a week, today, and tomorrow (for evening weather). */
export function countWindow(istDate: string): {
  fromDate: string;
  toDate: string;
  tomorrow: string;
} {
  return {
    fromDate: shiftDate(istDate, -7),
    toDate: istDate,
    tomorrow: shiftDate(istDate, 1),
  };
}
