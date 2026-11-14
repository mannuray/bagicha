/**
 * Crop calendar logic: sowing windows for a climate group, task-title wording
 * and regional harvest days. The crops themselves are catalogue data
 * (modules/catalogue, filled from its seed by the push).
 * Spec: docs/superpowers/specs/2026-11-11-vegetables-design.md §2.1, §6.1.
 */
import { RegionCluster } from '@prisma/client';
import type {
  CareStep,
  ClimateGroup,
  CropInfo,
  Journey,
} from '../../catalogue';

export type { CareStep, ClimateGroup, CropInfo };

export function climateGroupFor(region: RegionCluster): ClimateGroup {
  if (region === RegionCluster.HILLS_COOL) return 'HILLS';
  if (
    region === RegionCluster.SOUTH_DECCAN ||
    region === RegionCluster.COASTAL_HUMID
  )
    return 'PENINSULAR';
  return 'PLAINS';
}

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const SOON_DAYS = 30;

/** Midnight IST on the 1st of `month` (1–12) of `year`. */
const istMonthStart = (year: number, month: number) =>
  new Date(Date.UTC(year, month - 1, 1) - IST_OFFSET_MS);

export interface WindowInstance {
  index: number;
  start: Date;
  /** Exclusive: midnight IST after the window's last day. */
  end: Date;
}

/** Concrete dates for every window starting in the years around `now`, by start. */
function instances(
  crop: CropInfo,
  group: ClimateGroup,
  now: Date,
): WindowInstance[] {
  const year = new Date(now.getTime() + IST_OFFSET_MS).getUTCFullYear();
  const out: WindowInstance[] = [];
  for (const y of [year - 1, year, year + 1]) {
    crop.windows[group].forEach(([startMonth, endMonth], index) => {
      const endYear = endMonth < startMonth ? y + 1 : y;
      out.push({
        index,
        start: istMonthStart(y, startMonth),
        end: istMonthStart(endYear, endMonth + 1),
      });
    });
  }
  return out.sort((a, b) => a.start.getTime() - b.start.getTime());
}

export interface WindowStatus {
  status: 'open' | 'soon' | 'later' | 'none';
  window_index?: number;
  opens_in_days?: number;
  next_month?: number;
}

/** Whether the crop can be sown now in this climate group, or how soon. */
export function windowStatus(
  crop: CropInfo,
  group: ClimateGroup,
  now: Date,
): WindowStatus {
  if (crop.windows[group].length === 0) return { status: 'none' };
  const all = instances(crop, group, now);
  const open = all.find((w) => w.start <= now && now < w.end);
  if (open) return { status: 'open', window_index: open.index };
  const next = all.find((w) => w.start > now);
  if (!next) return { status: 'none' };
  const days = Math.ceil((next.start.getTime() - now.getTime()) / DAY_MS);
  if (days <= SOON_DAYS)
    return { status: 'soon', window_index: next.index, opens_in_days: days };
  return {
    status: 'later',
    window_index: next.index,
    next_month: crop.windows[group][next.index][0],
  };
}

/** The earliest window, open now or future, in which no season of this crop has started. */
export function nextWindow(
  crop: CropInfo,
  group: ClimateGroup,
  now: Date,
  usedStarts: Date[],
): WindowInstance | null {
  const used = new Set(usedStarts.map((d) => d.getTime()));
  return (
    instances(crop, group, now).find(
      (w) => w.end > now && !used.has(w.start.getTime()),
    ) ?? null
  );
}

/** The window instance a date falls in, if any (to mark a window as used by a season). */
export function windowContaining(
  crop: CropInfo,
  group: ClimateGroup,
  at: Date,
): WindowInstance | null {
  return (
    instances(crop, group, at).find((w) => w.start <= at && at < w.end) ?? null
  );
}

/** The crop's name for task titles: "Spinach (Palak)" → "spinach". The page still shows the full name. */
export function titleName(crop: CropInfo): string {
  return crop.name.replace(/\s*\(.*\)\s*$/, '').toLowerCase();
}

/**
 * The "has it come up?" reminder: seedlings only for seeds raised in a tray;
 * seeds sown in the bed sprout, and tubers, cloves and rhizomes send up shoots.
 */
export function sproutCheckTitle(
  crop: CropInfo,
  journey: Journey,
  nursery: boolean,
): string {
  const name = titleName(crop);
  if (nursery) return `Check the ${name} seedlings have come up`;
  return journey === 'PLANT'
    ? `Check the planted ${name} for shoots`
    : `Check the sown ${name} for sprouts`;
}

/** The crop as grown in a climate group: its harvest days where that group differs. */
export function inGroup(crop: CropInfo, group: ClimateGroup): CropInfo {
  const harvest = crop.harvest_by_group?.[group];
  return harvest ? { ...crop, days_to_first_harvest: harvest } : crop;
}
