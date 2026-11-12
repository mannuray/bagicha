import { LifecycleStage, RegionCluster } from '@prisma/client';
import { resolveRegionCare, stageOf } from './region-care';

/** Callers check careApplies() first; a pending region never reaches the engine. */
function verifiedCare(family: FamilyCare, region: RegionCluster) {
  const resolved = resolveRegionCare(family, region);
  if (!resolved)
    throw new Error(`${family.family}: ${region} is pending verification`);
  return resolved;
}
import type {
  CareCategory,
  CareItem,
  Dose,
  DosePart,
  FamilyCare,
  MonthDay,
} from './types';

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

/** One line of "this month" on the plant page: what to do and how. */
export interface CareLine {
  title: string;
  organic: string;
  chemical: string | null;
  why: string;
  amount: string | null;
  /** Set for "only if you see it" items: the sign to look for. */
  if_you_see: string | null;
}

export interface TreeCareInput {
  region: RegionCluster;
  stage: LifecycleStage;
  plantedAt: Date | null;
  now: Date;
  /** Source keys of this tree's care reminders still pending: they count toward the cap. */
  openKeys?: string[];
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

/** Whole years since planting, at least 1; null when the planting date is unknown. */
function ageYears(plantedAt: Date | null, now: Date): number | null {
  if (!plantedAt) return null;
  const years = Math.floor(
    (now.getTime() - plantedAt.getTime()) / (365.25 * DAY_MS),
  );
  return Math.max(years, 1);
}

const weight = (grams: number) =>
  grams >= 1000
    ? `${Number((grams / 1000).toFixed(1))} kg`
    : `${Math.round(grams)} g`;

const doseLine = (parts: DosePart[], years: number) =>
  parts.map((p) => `${weight(p.grams * years)} ${p.what}`).join(' + ');

/**
 * This tree's dose ("For a 6-year-old tree: 30 kg FYM; or 660 g urea …"), or the
 * per-year rule when its age is unknown.
 */
export function doseFor(dose: Dose, age: number | null): string {
  const years = age === null ? 1 : Math.min(age, dose.maxAgeYears);
  const lines = [doseLine(dose.organic, years), doseLine(dose.chemical, years)]
    .filter(Boolean)
    .join(dose.together ? ' + ' : '; or ');
  return age === null
    ? `Per year of the tree's age (up to ${dose.maxAgeYears}): ${lines}`
    : age > dose.maxAgeYears
      ? `For a tree ${dose.maxAgeYears} years or older: ${lines}`
      : `For ${/^(8|11|18)$/.test(String(years)) ? 'an' : 'a'} ${years}-year-old tree: ${lines}`;
}

/**
 * The care a tree is due now: at most three dated reminders, by priority; the
 * rest (and every "only if you see …" item) stays on the plant page.
 */
export function treeCareDue(
  family: FamilyCare,
  input: TreeCareInput,
): {
  reminders: CareReminder[];
  onPage: CareItem[];
  /** Source keys of every occurrence current now (open or within the lookahead). */
  current: string[];
  /** Everything for the plant page: all current items by priority, then the "if you see it" ones. */
  thisMonth: CareLine[];
  note: string | null;
} {
  const { care, grownHere } = verifiedCare(family, input.region);
  const stage = stageOf(input.stage);
  const age = ageYears(input.plantedAt, input.now);
  const open = new Set(input.openKeys ?? []);
  const keyOf = (item: CareItem, start: Date) =>
    `${family.family}:${item.key}:${ymd(start)}`;
  const candidates: Array<{
    item: CareItem;
    start: Date;
    end: Date;
    openNow: boolean;
    sourceKey: string;
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
    else
      candidates.push({
        item,
        ...window,
        sourceKey: keyOf(item, window.start),
      });
  }
  // Already-pending reminders keep their place; new ones fill the rest of the
  // tree's cap by priority, so a tree never holds more than three.
  const byPriority = (a: (typeof candidates)[0], b: (typeof candidates)[0]) =>
    PRIORITY.indexOf(a.item.category) - PRIORITY.indexOf(b.item.category);
  const pending = candidates.filter((c) => open.has(c.sourceKey));
  const fresh = candidates
    .filter((c) => !open.has(c.sourceKey))
    .sort(byPriority);
  const room = Math.max(MAX_REMINDERS - pending.length, 0);
  const chosen = [...pending, ...fresh.slice(0, room)].sort(byPriority);
  onPage.push(...fresh.slice(room).map((c) => c.item));
  const reminders = chosen.map(
    ({ item, start, end, openNow, sourceKey }): CareReminder => ({
      key: item.key,
      title: item.title,
      category: item.category,
      due: openNow ? input.now : start,
      windowEnd: end,
      sourceKey,
      organic: item.organic,
      chemical: item.chemical ?? null,
      why: item.why,
      amount: item.dose ? doseFor(item.dose, age) : null,
    }),
  );
  const line = (item: CareItem): CareLine => ({
    title: item.title,
    organic: item.organic,
    chemical: item.chemical ?? null,
    why: item.why,
    amount: item.dose ? doseFor(item.dose, age) : null,
    if_you_see: item.conditional ?? null,
  });
  const thisMonth = [
    ...[...candidates].sort(byPriority).map((c) => line(c.item)),
    ...onPage
      .filter((i) => i.conditional || i.when.kind !== 'CALENDAR')
      .map(line),
  ];
  return {
    reminders,
    onPage,
    current: candidates.map((c) => c.sourceKey),
    thisMonth,
    note: grownHere ? null : NOT_GROWN_NOTE,
  };
}

export interface CarePhase {
  current_phase: string;
  upcoming_phase: string;
  do_now: string[];
  avoid_now: string[];
  watch_for: string[];
  note: string | null;
}

/** Shown when no phase window covers today. */
const BETWEEN_PHASES = 'growing';
const CONDITIONAL_PREFIX = 'If you see it: ';

/**
 * What the tree is doing now and next, with this phase's avoid and watch lists
 * and the care open now. Same shape the season pack gave the plant page.
 */
export function carePhaseView(
  family: FamilyCare,
  input: Omit<TreeCareInput, 'plantedAt'>,
): CarePhase {
  const { care, grownHere } = verifiedCare(family, input.region);
  const stage = stageOf(input.stage);
  const windows = care.phases
    .filter((p) => p.stages.includes(stage) && p.when.kind === 'CALENDAR')
    .map((p) => {
      const when = p.when as Extract<CareItem['when'], { kind: 'CALENDAR' }>;
      return { phase: p, ...occurrenceOf(when.from, when.to, input.now) };
    });
  const now = input.now.getTime();
  const current = windows.find((w) => w.start.getTime() <= now);
  const upcoming = windows
    .filter((w) => w !== current)
    .map((w) =>
      w.start.getTime() > now
        ? w
        : { ...w, start: new Date(w.start.getTime() + 365 * DAY_MS) },
    )
    .sort((a, b) => a.start.getTime() - b.start.getTime())[0];
  const doNow = care.items
    .filter((i) => i.stages.includes(stage) && windowOf(i, input.now)?.openNow)
    .map((i) => (i.conditional ? `${CONDITIONAL_PREFIX}${i.title}` : i.title));
  return {
    current_phase: current?.phase.phase ?? BETWEEN_PHASES,
    upcoming_phase:
      upcoming?.phase.phase ?? current?.phase.phase ?? BETWEEN_PHASES,
    do_now: doNow,
    avoid_now: current?.phase.avoid ?? [],
    watch_for: current?.phase.watch ?? [],
    note: grownHere ? null : NOT_GROWN_NOTE,
  };
}
