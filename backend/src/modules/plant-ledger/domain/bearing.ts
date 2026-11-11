import type { BearingStatus, PlantingDatePrecision } from '@prisma/client';
import type { LifeProfile } from './species-life-profiles';
import { ValidationError } from '../../../common/errors';

const MONTH_MS = (365.25 / 12) * 24 * 60 * 60 * 1000;

export interface BearingInput {
  bearing_status: BearingStatus | null;
  planting_date: Date | null;
  planting_date_precision?: PlantingDatePrecision | null;
  profile: LifeProfile | null;
}

/**
 * The earliest the tree can have been planted, for "is it past its first fruit?":
 * a bare year is stored as 1 January, so count from the end of that year instead —
 * never call a young tree old.
 */
export function plantedNoEarlierThan(
  date: Date,
  precision: PlantingDatePrecision | null | undefined,
): Date {
  if (precision !== 'YEAR') return new Date(date);
  return new Date(Date.UTC(new Date(date).getUTCFullYear() + 1, 0, 1));
}

/**
 * Whether the tree's firsts (flowering, fruit, harvest) happened before it was in
 * Bagicha: the gardener said it already fruits, or — not sure — it is older than
 * its species' latest usual first-fruit age. Then a log today is not its "first".
 * (Spec 2026-11-11-old-tree-milestones §2–3; the web estimate uses the same rule.)
 */
export function predatesFirsts(input: BearingInput, now: Date): boolean {
  if (input.bearing_status === 'BEARING') return true;
  if (input.bearing_status === 'NOT_YET') return false;
  if (!input.planting_date || !input.profile) return false;
  const planted = plantedNoEarlierThan(
    input.planting_date,
    input.planting_date_precision,
  );
  const months = (now.getTime() - planted.getTime()) / MONTH_MS;
  return months > input.profile.first_fruit_months[1];
}

export interface BearingAnswer {
  bearing_status: BearingStatus | null;
  bearing_since_year: number | null;
}

/**
 * The bearing answer to store: trees only, a since-year only with BEARING, never in
 * the future or before the planted year. Throws a ValidationError otherwise.
 */
export function resolveBearing(
  answer: BearingAnswer,
  context: {
    record_kind: string;
    planting_date: Date | null;
    now: Date;
    /** The year was stored before, not sent now: drop it if it no longer fits. */
    yearIsStored?: boolean;
  },
): BearingAnswer {
  if (context.record_kind !== 'TREE') {
    return { bearing_status: null, bearing_since_year: null };
  }
  if (
    answer.bearing_status !== 'BEARING' ||
    answer.bearing_since_year === null
  ) {
    return { bearing_status: answer.bearing_status, bearing_since_year: null };
  }
  const year = answer.bearing_since_year;
  const planted = context.planting_date
    ? new Date(context.planting_date).getUTCFullYear()
    : null;
  if (
    year > context.now.getUTCFullYear() ||
    (planted !== null && year < planted)
  ) {
    if (context.yearIsStored) {
      return {
        bearing_status: answer.bearing_status,
        bearing_since_year: null,
      };
    }
    throw new ValidationError(
      'BEARING_SINCE_YEAR_INVALID',
      'The fruiting year must be between the planted year and this year',
    );
  }
  return answer;
}

/**
 * Firsts recorded after the year the gardener says the tree began fruiting are
 * not firsts (logged before this question existed); they are cleared. With no
 * year nothing is cleared: firsts logged in Bagicha may well be real.
 */
export function firstsToClear(
  plant: {
    first_flowering_at: Date | null;
    first_fruit_set_at: Date | null;
    first_harvest_at: Date | null;
  },
  sinceYear: number | null,
): Partial<
  Record<'first_flowering_at' | 'first_fruit_set_at' | 'first_harvest_at', null>
> {
  const clear: Partial<
    Record<
      'first_flowering_at' | 'first_fruit_set_at' | 'first_harvest_at',
      null
    >
  > = {};
  for (const key of [
    'first_flowering_at',
    'first_fruit_set_at',
    'first_harvest_at',
  ] as const) {
    const at = plant[key];
    if (at && sinceYear !== null && new Date(at).getUTCFullYear() > sinceYear) {
      clear[key] = null;
    }
  }
  return clear;
}
