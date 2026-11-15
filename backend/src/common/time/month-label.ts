import type { Lang } from '../http/lang';

const EN = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
/** Hindi month names in full: short Hindi forms ("अक्टू॰") read oddly. */
const HI = EN.map((_, i) =>
  new Intl.DateTimeFormat('hi-IN', { month: 'long', timeZone: 'UTC' }).format(
    new Date(Date.UTC(2026, i, 1)),
  ),
);

/** A month (1–12) by name: "Oct" or "अक्टूबर". */
export function monthName(month: number, lang: Lang): string {
  return (lang === 'hi' ? HI : EN)[month - 1];
}

/** A month window: "Oct–Nov" or "अक्टूबर–नवंबर". */
export function monthRange(start: number, end: number, lang: Lang): string {
  return `${monthName(start, lang)}–${monthName(end, lang)}`;
}

/** A date's IST month and year: "Oct 2026" or "अक्टूबर 2026". */
export function monthYear(d: Date, lang: Lang): string {
  const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
  return `${monthName(ist.getUTCMonth() + 1, lang)} ${ist.getUTCFullYear()}`;
}
