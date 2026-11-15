import { RegionCluster } from '@prisma/client';
import { DISTRICTS, STATE_ALIASES, type District } from './districts';

/** "Aurangabad" names districts in two states: it is only a match together with the state. */
export const SHARED_NAMES = new Set([
  'Aurangabad',
  'Bilaspur',
  'Hamirpur',
  'Pratapgarh',
  'Balrampur',
  'Bijapur',
  'Raigarh',
]);

/** Sikkim's "North", "East"…: an alias only together with the state, like Delhi's. */
export const DIRECTIONS = new Set(['North', 'South', 'East', 'West']);

/** Lower-case, accents and punctuation gone, single spaces: "Leh(Ladakh)" → "leh ladakh". */
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

interface Form {
  text: string;
  district: District;
  shared: boolean;
}

const FORMS: Form[] = DISTRICTS.flatMap((d) =>
  [d.name, ...d.aliases].map((f) => ({
    text: normalize(f),
    district: d,
    shared: SHARED_NAMES.has(f) || (DIRECTIONS.has(f) && f !== d.name),
  })),
);
const STATE_FORMS = new Map<string, string[]>(
  [...new Set(DISTRICTS.map((d) => d.state))].map((s) => [
    s,
    [s, ...(STATE_ALIASES[s] ?? [])].map(normalize),
  ]),
);

const hasWords = (haystack: string, needle: string) =>
  ` ${haystack} `.includes(` ${needle} `);
const statesIn = (text: string) =>
  new Set(
    [...STATE_FORMS]
      .filter(([, forms]) => forms.some((f) => hasWords(text, f)))
      .map(([s]) => s),
  );

/** One district, or none when the candidates can't be told apart (or need a state that isn't there). */
function pick(forms: Form[], states: Set<string>): District | null {
  const usable = forms.filter(
    (f) =>
      (!f.district.needsState && !f.shared) || states.has(f.district.state),
  );
  const byState = states.size
    ? usable.filter((f) => states.has(f.district.state))
    : usable;
  const chosen = new Set(
    (byState.length ? byState : usable).map((f) => f.district),
  );
  return chosen.size === 1 ? [...chosen][0] : null;
}

/**
 * The district a person means: an exact name or alias, else the longest whole-word
 * name inside the text ("Patna city"). A state after a comma (or anywhere) settles
 * shared names; a name hidden inside another word never matches.
 */
export function matchDistrict(text: string): District | null {
  const full = normalize(text);
  if (!full) return null;
  const [head] = text.split(',');
  const name = normalize(head);
  const states = statesIn(full);

  const exact = FORMS.filter((f) => f.text === name);
  if (exact.length) return pick(exact, states);

  const inside = FORMS.filter(
    (f) =>
      hasWords(full, f.text) &&
      !STATE_FORMS.get(f.district.state)?.includes(f.text),
  );
  if (!inside.length) return null;
  const longest = Math.max(...inside.map((f) => f.text.length));
  return pick(
    inside.filter((f) => f.text.length === longest),
    states,
  );
}

/** Each state's region, when all its districts share one ("Goa"); none for Karnataka. */
const STATE_REGION = new Map(
  [...STATE_FORMS.keys()].flatMap((state) => {
    const regions = new Set(
      DISTRICTS.filter((d) => d.state === state).map((d) => d.region),
    );
    return regions.size === 1 ? [[state, [...regions][0]] as const] : [];
  }),
);

/** The district's region, else that of a lone state named in the text whose districts all share one. */
export function regionForDistrict(text: string): RegionCluster | null {
  const district = matchDistrict(text);
  if (district) return district.region;
  const states = [...statesIn(normalize(text))];
  return states.length === 1 ? (STATE_REGION.get(states[0]) ?? null) : null;
}

/** How the district is saved and shown: "Gaya", or "Aurangabad, Bihar" when the name alone is ambiguous. */
export function districtLabel(d: District): string {
  const ambiguous =
    d.needsState || [d.name, ...d.aliases].some((f) => SHARED_NAMES.has(f));
  return ambiguous ? `${d.name}, ${d.state}` : d.name;
}
