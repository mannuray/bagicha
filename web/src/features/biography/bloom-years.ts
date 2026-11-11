import { istParts } from '../../lib/ist';
import { BLOOM_TYPES, type LogType } from '../journal';

export interface BloomYear {
  year: number;
  count: number;
  /** When the year's first bloom was logged (ISO). */
  first: string;
}

/** A flower's blooms per India year, newest first, with the first bloom of each year. */
export function bloomYears(entries: Array<{ type: string; timestamp: string }>): BloomYear[] {
  const years = new Map<number, BloomYear>();
  for (const e of entries) {
    if (!BLOOM_TYPES.includes(e.type as LogType)) continue;
    const year = istParts(new Date(e.timestamp)).year;
    const cur = years.get(year);
    years.set(year, {
      year,
      count: (cur?.count ?? 0) + 1,
      first: cur && new Date(cur.first) < new Date(e.timestamp) ? cur.first : e.timestamp,
    });
  }
  return [...years.values()].sort((a, b) => b.year - a.year);
}
