import { LifecycleStage, RegionCluster } from '@prisma/client';
import { resolveRegionCare, stageOf } from './region-care';
import type { CareCategory, CareItem, FamilyCare, MonthDay } from './types';

export const NOT_GROWN_NOTE =
  'Not usually grown in your region; timings may differ.';

/** Reminders a tree may get in a month: more would be noise (spec §5.4). */
const MAX_REMINDERS = 3;
/** Items opening this soon become reminders now, due at their start. */
const LOOKAHEAD_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const PRIORITY: CareCategory[] = [
  'PROTECTION',
  'FEEDING',
  'PRUNING',
  'WATERING',
  'GENERAL',
];

export interface CareReminder {
  key: string;
  title: string;
  category: CareCategory;
  due: Date;
  windowEnd: Date;
  /** `${family}:${key}:${window start as YYYY-MM-DD}`: one task per occurrence. */
  sourceKey: string;
  organic: string;
  chemical: string | null;
  why: string;
  amount: string | null;
}

export interface TreeCareInput {
  region: RegionCluster;
  stage: LifecycleStage;
  plantedAt: Date | null;
  now: Date;
}

/** Midnight IST of a calendar date. */
function istMidnight(year: number, [month, day]: MonthDay): Date {
  return new Date(Date.UTC(year, month - 1, day) - IST_OFFSET_MS);
}

function istYear(date: Date): number {
  return new Date(date.getTime() + IST_OFFSET_MS).getUTCFullYear();
}

const ymd = (date: Date) =>
  new Date(date.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);

/**
 * The occurrence of a calendar window that is open now or opens next.
 * A window may cross New Year (Dec 15 – Jan 20): it belongs to the year it starts in.
 */
export function occurrenceOf(
  from: MonthDay,
  to: MonthDay,
  now: Date,
): { start: Date; end: Date } {
  const wraps = to[0] < from[0] || (to[0] === from[0] && to[1] < from[1]);
  const year = istYear(now);
  for (const startYear of [year - 1, year, year + 1]) {
    const start = istMidnight(startYear, from);
    const end = istMidnight(wraps ? startYear + 1 : startYear, to);
    if (now.getTime() < end.getTime() + DAY_MS) return { start, end };
  }
  /* istanbul ignore next: startYear year+1 always ends in the future */
  throw new Error('unreachable');
}

/** Whether an item's window is open now, or the start of one opening soon. */
export function windowOf(
  item: { when: CareItem['when'] },
  now: Date,
): { start: Date; end: Date; openNow: boolean } | null {
  if (item.when.kind !== 'CALENDAR') return null;
  const { start, end } = occurrenceOf(item.when.from, item.when.to, now);
  const openNow = start.getTime() <= now.getTime();
  if (!openNow && start.getTime() - now.getTime() > LOOKAHEAD_DAYS * DAY_MS)
    return null;
  return { start, end, openNow };
}

function ageBand(
  stage: LifecycleStage,
  plantedAt: Date | null,
  now: Date,
): keyof NonNullable<CareItem['amounts']> {
  if (!plantedAt) return stageOf(stage) === 'YOUNG' ? 'upTo3y' : 'y4to7';
  const years = (now.getTime() - plantedAt.getTime()) / (365.25 * DAY_MS);
  if (years < 4) return 'upTo3y';
  return years < 8 ? 'y4to7' : 'y8plus';
}

/**
 * The care a tree is due now: at most three dated reminders, by priority; the
 * rest (and every "only if you see …" item) stays on the plant page.
 */
export function treeCareDue(
  family: FamilyCare,
  input: TreeCareInput,
): { reminders: CareReminder[]; onPage: CareItem[]; note: string | null } {
  const { care, grownHere } = resolveRegionCare(family, input.region);
  const stage = stageOf(input.stage);
  const band = ageBand(input.stage, input.plantedAt, input.now);
  const candidates: Array<{
    item: CareItem;
    start: Date;
    end: Date;
    openNow: boolean;
  }> = [];
  const onPage: CareItem[] = [];
  for (const item of care.items) {
    if (!item.stages.includes(stage)) continue;
    if (item.when.kind !== 'CALENDAR') {
      onPage.push(item);
      continue;
    }
    const window = windowOf(item, input.now);
    if (!window) continue;
    if (item.conditional) onPage.push(item);
    else candidates.push({ item, ...window });
  }
  candidates.sort(
    (a, b) =>
      PRIORITY.indexOf(a.item.category) - PRIORITY.indexOf(b.item.category),
  );
  onPage.push(...candidates.slice(MAX_REMINDERS).map((c) => c.item));
  const reminders = candidates.slice(0, MAX_REMINDERS).map(
    ({ item, start, end, openNow }): CareReminder => ({
      key: item.key,
      title: item.title,
      category: item.category,
      due: openNow ? input.now : start,
      windowEnd: end,
      sourceKey: `${family.family}:${item.key}:${ymd(start)}`,
      organic: item.organic,
      chemical: item.chemical ?? null,
      why: item.why,
      amount: item.amounts?.[band] ?? null,
    }),
  );
  return { reminders, onPage, note: grownHere ? null : NOT_GROWN_NOTE };
}
