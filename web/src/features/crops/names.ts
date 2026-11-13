/** "Spinach (Palak)" → "Palak": the everyday name gardeners use. */
export function shortName(crop: { name: string }): string {
  return /\(([^)]+)\)/.exec(crop.name)?.[1] ?? crop.name;
}

/** The first Devanagari alias, e.g. "पालक". */
export function hindiName(crop: { aliases: string[] }): string | null {
  return crop.aliases.find((a) => /[ऀ-ॿ]/.test(a)) ?? null;
}

/** Case-insensitive match on the name or any alias (Hindi included). */
export function matchesSearch(crop: { name: string; aliases: string[] }, query: string): boolean {
  const q = query.trim().toLowerCase();
  return !q || [crop.name, ...crop.aliases].some((n) => n.toLowerCase().includes(q));
}

type Sun = 'FULL' | 'PARTIAL' | 'SHADE';
const SUN_RANK: Record<Sun, number> = { SHADE: 0, PARTIAL: 1, FULL: 2 };

/** The best sun among places that have it set, or null when none do. */
export function sunniest(places: Array<{ sun_hours: Sun | null }>): Sun | null {
  return places.reduce<Sun | null>((best, p) => (p.sun_hours && (!best || SUN_RANK[p.sun_hours] > SUN_RANK[best]) ? p.sun_hours : best), null);
}

/** A full-sun crop needs a full-sun place; a partial-sun crop is happy in partial or full. */
export function suitsSun(crop: { sun: 'FULL' | 'PARTIAL' }, place: Sun): boolean {
  return SUN_RANK[place] >= SUN_RANK[crop.sun];
}

/** The order a crop goes through, from its method and care steps. */
export function growingSteps(crop: { kind?: string; method: string; care: Array<{ key: string }>; thin_after_days: number | null }): string[] {
  const care = crop.care.map((c) => c.key);
  // A flower's journey ends in bloom, not harvest.
  const end = crop.kind === 'FLOWER' ? 'bloom' : 'harvest';
  if (crop.method === 'NURSERY_TRANSPLANT') return ['seeds', 'nursery', 'transplant', ...care, end];
  if (crop.method === 'DIRECT_SOW') return ['seeds', 'sow', ...(crop.thin_after_days ? ['thin'] : []), ...care, end];
  return [`material.${crop.method}`, 'plant', ...care, end];
}


export type CalendarFilter = 'container' | 'beginner' | 'quick' | 'long' | 'sun';

interface CalendarCrop {
  name: string;
  aliases: string[];
  kind: string;
  status: string;
  tags: string[];
  sun: 'FULL' | 'PARTIAL';
}

/**
 * The sowing calendar's view: one kind, matching the search and every chosen filter
 * ("sun" = suits the sunniest place, ignored with no places), split by sowing status.
 */
export function filterCalendar<C extends CalendarCrop>(
  items: C[],
  criteria: { kind: string; query: string; filters: CalendarFilter[]; sun: Sun | null },
): { open: C[]; soon: C[]; later: C[] } {
  const { kind, query, filters, sun } = criteria;
  const visible = items.filter(
    (c) =>
      c.kind === kind &&
      matchesSearch(c, query) &&
      filters.every((f) => (f === 'sun' ? sun === null || suitsSun(c, sun) : c.tags.includes(f))),
  );
  return {
    open: visible.filter((c) => c.status === 'open'),
    soon: visible.filter((c) => c.status === 'soon'),
    // Not grown in this region: still findable, folded with the later ones.
    later: visible.filter((c) => c.status === 'later' || c.status === 'none'),
  };
}

export interface CropFact {
  icon: string;
  labelKey: string;
  /** A days range ("5–8 days"). */
  range?: [number, number];
  /** About this many days. */
  days?: number;
}

/** The crop page's quick facts; ones with no value are left out. */
export function cropFacts(crop: {
  kind: string;
  method: string;
  germination_days: [number, number] | null;
  transplant_after_days: [number, number] | null;
  days_to_first_harvest: [number, number] | null;
  harvest_span_days: number | null;
}): CropFact[] {
  const flower = crop.kind === 'FLOWER';
  const facts: Array<CropFact | null> = [
    crop.germination_days ? { icon: 'psychiatry', labelKey: 'crops.detail.germinates', range: crop.germination_days } : null,
    crop.method === 'NURSERY_TRANSPLANT' && crop.transplant_after_days
      ? { icon: 'move_down', labelKey: 'crops.detail.transplantAt', range: crop.transplant_after_days }
      : null,
    crop.days_to_first_harvest
      ? { icon: flower ? 'local_florist' : 'nutrition', labelKey: flower ? 'crops.detail.firstBloom' : 'crops.detail.firstHarvest', range: crop.days_to_first_harvest }
      : null,
    flower && crop.harvest_span_days ? { icon: 'event_repeat', labelKey: 'crops.detail.bloomsFor', days: crop.harvest_span_days } : null,
  ];
  return facts.filter((f): f is CropFact => f !== null);
}

/** The chooser's "good to sow now": the first three vegetables open now, by short name. */
export function sowNowNames(calendar: Array<{ name: string; kind: string; status: string }>): string[] {
  return calendar.filter((c) => c.kind === 'CROP' && c.status === 'open').slice(0, 3).map(shortName);
}

/** A days range for display: "90–100", or one number when both ends match ("85"). */
export function daySpan([min, max]: readonly [number, number]): string {
  return min === max ? String(min) : `${min}–${max}`;
}
