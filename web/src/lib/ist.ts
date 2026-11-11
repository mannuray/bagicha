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

/** A picked calendar day ("2026-03-10") pinned to its noon in India, as an ISO instant. */
export function istNoonIso(day: string): string {
  return new Date(`${day}T12:00:00+05:30`).toISOString();
}

/** The calendar day in India for an instant, as "YYYY-MM-DD" (what a date input holds). */
export function istDateString(at: Date): string {
  const { year, month, day } = istParts(at);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
