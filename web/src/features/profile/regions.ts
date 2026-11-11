import type { RegionCluster } from '../auth';

export interface Region {
  id: RegionCluster;
  labelKey: string;
  examplesKey: string;
}

/** The seven agro-climatic regions the backend plans seasons for. */
export const REGIONS: readonly Region[] = [
  { id: 'EAST_INDIA', labelKey: 'regions.EAST_INDIA.label', examplesKey: 'regions.EAST_INDIA.examples' },
  { id: 'NORTH_INDIA', labelKey: 'regions.NORTH_INDIA.label', examplesKey: 'regions.NORTH_INDIA.examples' },
  { id: 'WEST_INDIA', labelKey: 'regions.WEST_INDIA.label', examplesKey: 'regions.WEST_INDIA.examples' },
  { id: 'CENTRAL_INDIA', labelKey: 'regions.CENTRAL_INDIA.label', examplesKey: 'regions.CENTRAL_INDIA.examples' },
  { id: 'SOUTH_DECCAN', labelKey: 'regions.SOUTH_DECCAN.label', examplesKey: 'regions.SOUTH_DECCAN.examples' },
  { id: 'COASTAL_HUMID', labelKey: 'regions.COASTAL_HUMID.label', examplesKey: 'regions.COASTAL_HUMID.examples' },
  { id: 'HILLS_COOL', labelKey: 'regions.HILLS_COOL.label', examplesKey: 'regions.HILLS_COOL.examples' },
];

/** One district from GET /regions/districts. `label` is how it is saved ("Aurangabad, Bihar" for shared names). */
export interface DistrictOption {
  name: string;
  state: string;
  region: RegionCluster;
  label: string;
  aliases: string[];
}

/** Lower-case words only; a trailing "district" or "city" is dropped ("Patna district" → "patna"). */
const norm = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9,]+/g, ' ')
    .replace(/\b(district|city)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const forms = (d: DistrictOption) => [d.name, ...d.aliases].map(norm);

/**
 * The region of a district on the list: its label, name or alias, with "Name, State"
 * settling names two states share. Null when unknown or ambiguous, so the user
 * picks the closest region themselves.
 */
export function knownRegion(district: string, list: readonly DistrictOption[]): RegionCluster | null {
  const text = norm(district);
  if (!text) return null;
  const byLabel = list.find((d) => norm(d.label) === text);
  if (byLabel) return byLabel.region;
  const [name, ...rest] = text.split(',').map((part) => part.trim());
  const state = rest.join(' ');
  const matches = list.filter((d) => forms(d).includes(name) && (!state || norm(d.state).startsWith(state)));
  return matches.length === 1 ? matches[0].region : null;
}

/** Up to `max` districts whose name or alias starts with what was typed (or has a word that does). */
export function suggestDistricts(typed: string, list: readonly DistrictOption[], max = 6): DistrictOption[] {
  const q = norm(typed).replace(/,/g, '');
  if (q.length < 2) return [];
  const score = (d: DistrictOption) => {
    const all = forms(d);
    if (all.some((f) => f.startsWith(q))) return 0;
    if (all.some((f) => f.split(' ').some((w) => w.startsWith(q)))) return 1;
    return -1;
  };
  return list
    .map((d) => ({ d, s: score(d) }))
    .filter(({ s }) => s >= 0)
    .sort((a, b) => a.s - b.s || a.d.name.localeCompare(b.d.name))
    .slice(0, max)
    .map(({ d }) => d);
}

export const regionById = (id: RegionCluster | null | undefined) => REGIONS.find((r) => r.id === id);
