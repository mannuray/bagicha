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
