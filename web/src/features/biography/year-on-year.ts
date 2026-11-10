import { istParts } from '../../lib/ist';
import type { Cycle } from '../plants';

const DASH = '—';
const DROP_RANK: Record<string, number> = { NONE: 0, LOW: 1, MEDIUM: 2, HIGH: 3 };

export type Trend = 'better' | 'worse' | 'same' | null;

export interface YearRow {
  year: number;
  value: number | null;
  unit: string | null;
  barred: boolean;
  soFar: boolean;
}

/**
 * A season can be compared once its year is over. A first pick in May isn't the
 * season, so the current year stays "so far" and is never marked better or worse.
 */
export function isFinished(c: Cycle, now: Date): boolean {
  return c.cycle_year < istParts(now).year;
}

/** Yield per year (newest first) and the two most recent finished seasons to compare. */
export function yearOnYear(cycles: Cycle[], now: Date): { unit: string | null; years: YearRow[]; latest: Cycle | null; previous: Cycle | null } {
  const sorted = [...cycles].sort((a, b) => b.cycle_year - a.cycle_year);
  const finished = sorted.filter((c) => isFinished(c, now));
  const unit = finished.find((c) => c.yield_quantity !== null && c.yield_unit)?.yield_unit ?? null;
  const years = sorted.map((c) => ({
    year: c.cycle_year,
    value: c.yield_quantity,
    unit: c.yield_unit,
    barred: c.yield_quantity !== null && unit !== null && c.yield_unit === unit && isFinished(c, now),
    soFar: !isFinished(c, now),
  }));
  return { unit, years, latest: finished[0] ?? null, previous: finished[1] ?? null };
}

const amount = (c: Cycle | null) =>
  c?.yield_quantity != null ? `${c.yield_quantity}${c.yield_unit ? ` ${c.yield_unit}` : ''}` : DASH;

const trendOf = (now: number, before: number, higherIsBetter: boolean): Trend => {
  if (now === before) return 'same';
  return now > before === higherIsBetter ? 'better' : 'worse';
};

/** Latest finished season against the one before; a missing value is a dash with no trend. */
export function compareRows(
  latest: Cycle,
  previous: Cycle | null,
): Array<{ key: 'yield' | 'flowerDrop' | 'fruitDrop' | 'pests'; now: string; before: string; trend: Trend }> {
  const sameUnit =
    previous !== null && latest.yield_quantity !== null && previous.yield_quantity !== null && latest.yield_unit === previous.yield_unit;
  const drop = (key: 'flowerDrop' | 'fruitDrop', field: 'flower_drop_level' | 'fruit_drop_level') => {
    const now = latest[field] in DROP_RANK ? latest[field] : DASH;
    const before = previous && previous[field] in DROP_RANK ? previous[field] : DASH;
    const trend = now !== DASH && before !== DASH ? trendOf(DROP_RANK[now], DROP_RANK[before], false) : null;
    return { key, now, before, trend };
  };
  return [
    {
      key: 'yield',
      now: amount(latest),
      before: amount(previous),
      trend: sameUnit ? trendOf(latest.yield_quantity as number, previous.yield_quantity as number, true) : null,
    },
    drop('flowerDrop', 'flower_drop_level'),
    drop('fruitDrop', 'fruit_drop_level'),
    {
      key: 'pests',
      now: String(latest.pest_pressure_score ?? DASH),
      before: previous ? String(previous.pest_pressure_score ?? DASH) : DASH,
      trend:
        previous && latest.pest_pressure_score !== null && previous.pest_pressure_score !== null
          ? trendOf(latest.pest_pressure_score, previous.pest_pressure_score, false)
          : null,
    },
  ];
}
