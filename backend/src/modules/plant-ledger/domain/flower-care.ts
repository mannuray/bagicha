/**
 * Perennial flower care and bloom status. The flowers themselves (bloom
 * months, care calendar, life ranges) live in the catalogue.
 * Spec: docs/superpowers/specs/2026-11-11-flowers-design.md §2.2.
 */
import { istMonth, istYear } from '../../../common/time';
import type { ClimateGroup, PerennialFlower } from '../../catalogue';

type Months = [number, number];

const MONTHS = [
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

/** Midnight IST on the 1st of a month. */
function firstOfMonthIst(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 1) - 5.5 * 60 * 60 * 1000);
}

/**
 * Care whose month is this IST month or next. Keyed by year and month, so each
 * feed in a year is its own task and a yearly task comes back next year.
 */
export function flowerCareDue(
  flower: PerennialFlower,
  group: ClimateGroup,
  now: Date,
) {
  const month = istMonth(now);
  const year = istYear(now);
  const next = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return flower.care[group]
    .filter((c) => c.month === month || c.month === next)
    .map((c) => {
      const thisMonth = c.month === month;
      const y = thisMonth ? year : nextYear;
      return {
        key: c.key,
        title: c.title,
        category: c.category,
        due: thisMonth ? now : firstOfMonthIst(y, c.month),
        sourceKey: `${flower.family}:${c.key}:${y}-${String(c.month).padStart(2, '0')}`,
      };
    });
}

const contains = ([a, b]: Months, m: number) =>
  a <= b ? m >= a && m <= b : m >= a || m <= b;
const label = ([a, b]: Months) =>
  a === 1 && b === 12 ? 'All year' : `${MONTHS[a - 1]}–${MONTHS[b - 1]}`;

/** Whether the flower is in its usual bloom months now, and which window to show. */
export function bloomStatus(
  flower: PerennialFlower,
  group: ClimateGroup,
  now: Date,
): { status: 'in_season' | 'later'; window_label: string } {
  const month = istMonth(now);
  const windows = flower.bloom[group];
  const current = windows.find((w) => contains(w, month));
  if (current) return { status: 'in_season', window_label: label(current) };
  const ahead = (w: Months) => (w[0] - month + 12) % 12;
  const upcoming = [...windows].sort((x, y) => ahead(x) - ahead(y))[0];
  return { status: 'later', window_label: label(upcoming) };
}

/**
 * One-time cleanup (spec §3.1): flowers made before this work ran the fruit
 * pack. Cancel their pending pack and overlay tasks; completed history stays.
 */
export const FLOWER_CLEANUP_SQL = `UPDATE "tasks" SET "status" = 'CANCELLED' WHERE "status" = 'PENDING' AND "source" IN ('SEASONAL_PACK', 'PERSONALIZED_OVERLAY') AND "tree_id" IN (SELECT "id" FROM "trees" WHERE "record_kind" = 'FLOWER')`;
