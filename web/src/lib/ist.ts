const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole IST calendar days from `from` to `to` (negative when `to` is earlier). */
export function istDayDiff(from: Date, to: Date): number {
  const day = (d: Date) => Math.floor((d.getTime() + IST_OFFSET_MS) / DAY_MS);
  return day(to) - day(from);
}

/** Calendar year, month (1-12) and day of a moment, in IST. */
export function istParts(d: Date): { year: number; month: number; day: number } {
  const shifted = new Date(d.getTime() + IST_OFFSET_MS);
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate() };
}
