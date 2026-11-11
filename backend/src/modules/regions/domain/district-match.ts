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
    shared: SHARED_NAMES.has(f),
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

export function regionForDistrict(text: string): RegionCluster | null {
  return matchDistrict(text)?.region ?? null;
}

/** How the district is saved and shown: "Gaya", or "Aurangabad, Bihar" when the name alone is ambiguous. */
export function districtLabel(d: District): string {
  const ambiguous =
    d.needsState || [d.name, ...d.aliases].some((f) => SHARED_NAMES.has(f));
  return ambiguous ? `${d.name}, ${d.state}` : d.name;
}
