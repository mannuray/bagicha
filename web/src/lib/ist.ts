const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole IST calendar days from `from` to `to` (negative when `to` is earlier). */
export function istDayDiff(from: Date, to: Date): number {
  const day = (d: Date) => Math.floor((d.getTime() + IST_OFFSET_MS) / DAY_MS);
  return day(to) - day(from);
}
