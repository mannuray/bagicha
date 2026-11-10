import { istParts } from '../../lib/ist';
import type { JournalEntry } from '../journal';

/** Record filters; each sends its types to the server (All sends none). */
export const TIMELINE_FILTERS = [
  { id: 'all', types: [] },
  { id: 'care', types: ['WATERING', 'PRUNING', 'FEEDING', 'TREATMENT'] },
  { id: 'bloom', types: ['FLOWERING', 'FRUIT_SET', 'FLOWER_DROP', 'FRUIT_DROP', 'GERMINATION', 'THINNING', 'BOLTING'] },
  { id: 'harvest', types: ['HARVEST'] },
  { id: 'health', types: ['PEST_DIAGNOSIS', 'DIAGNOSIS', 'WATERING_STRESS', 'WEATHER_DAMAGE'] },
  { id: 'notes', types: ['NOTE', 'PHOTO', 'PLANTING', 'PLANT_ENDED', 'SOWING', 'TRANSPLANTING', 'SEASON_END'] },
] as const satisfies ReadonlyArray<{ id: string; types: readonly string[] }>;

export type TimelineFilter = (typeof TIMELINE_FILTERS)[number];

/** Entries grouped by the IST year they happened in, newest year first. */
export function groupByYear(entries: JournalEntry[]): Array<{ year: number; entries: JournalEntry[] }> {
  const groups = new Map<number, JournalEntry[]>();
  for (const e of entries) {
    const year = istParts(new Date(e.timestamp)).year;
    groups.set(year, [...(groups.get(year) ?? []), e]);
  }
  return [...groups.entries()].sort(([a], [b]) => b - a).map(([year, list]) => ({ year, entries: list }));
}

export interface EntryTag {
  key: 'harvest' | 'drop';
  values: Record<string, string>;
}

function harvestAmount(m: Record<string, unknown>): string | null {
  if (typeof m.quantity_value === 'number') return typeof m.quantity_unit === 'string' ? `${m.quantity_value} ${m.quantity_unit}` : String(m.quantity_value);
  if (typeof m.quantity === 'string' && m.quantity.trim()) return m.quantity.trim();
  if (typeof m.quantity === 'number') return String(m.quantity);
  return null;
}

/** Structured metadata worth showing on a record card. */
export function entryTags(e: JournalEntry): EntryTag[] {
  const m = e.metadata;
  if (!m) return [];
  if (e.type === 'HARVEST') {
    const amount = harvestAmount(m);
    if (!amount) return [];
    return [{ key: 'harvest', values: { amount, ...(typeof m.quality === 'string' ? { quality: m.quality } : {}) } }];
  }
  if ((e.type === 'FLOWER_DROP' || e.type === 'FRUIT_DROP') && typeof m.severity === 'string') {
    return [{ key: 'drop', values: { severity: m.severity } }];
  }
  return [];
}
