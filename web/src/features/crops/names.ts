/** "Spinach (Palak)" → "Palak": the everyday name gardeners use. */
export function shortName(crop: { name: string }): string {
  return /\(([^)]+)\)/.exec(crop.name)?.[1] ?? crop.name;
}

/** The first Devanagari alias, e.g. "पालक". */
export function hindiName(crop: { aliases: string[] }): string | null {
  return crop.aliases.find((a) => /[ऀ-ॿ]/.test(a)) ?? null;
}

/** Hinglish spellings of one sound, folded together: gobhi = govi = gobi, phool = phul, dhaniya = dhania. */
const SOUNDS: Array<[RegExp, string]> = [
  [/ph/g, 'f'],
  [/ch/g, 'x'],
  [/[cq]/g, 'k'],
  [/[vw]/g, 'b'],
  [/z/g, 'j'],
  [/y/g, 'i'],
  [/ee/g, 'i'],
  [/oo/g, 'u'],
  [/h/g, ''],
  [/(.)\1+/g, '$1'],
];

/** A name as it sounds, for matching: lowercase, spelling swaps folded, punctuation gone. */
function sound(text: string): string {
  const plain = text.toLowerCase().replace(/[^a-z\p{Script=Devanagari}]+/gu, ' ').trim();
  return SOUNDS.reduce((s, [from, to]) => s.replace(from, to), plain);
}

/** Edits (insert, delete, change one letter) to turn a into b. */
function editDistance(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = row;
  }
  return prev[b.length];
}

/** One typo allowed from 5 letters, two from 8; shorter words must match as typed. */
const typosAllowed = (length: number) => (length >= 8 ? 2 : length >= 5 ? 1 : 0);

/** Close enough to a word of the name, or to how that word begins. */
function nearWord(q: string, name: string): boolean {
  const allowed = typosAllowed(q.length);
  if (allowed === 0) return false;
  const words = [...name.split(' '), name.replace(/ /g, '')];
  return words.some((w) => Math.min(editDistance(q, w), editDistance(q, w.slice(0, q.length))) <= allowed);
}

/** Matches the name or any alias, in English or Hindi, forgiving Hinglish spellings and a small typo. */
export function matchesSearch(crop: { name: string; aliases: string[] }, query: string): boolean {
  const raw = query.trim().toLowerCase();
  if (!raw) return true;
  const q = sound(raw);
  // Hindi script matches anywhere (गोभी in फूलगोभी); Latin from the start of a word,
  // so "matar" is peas, not the middle of "tamatar".
  const hindi = /\p{Script=Devanagari}/u.test(raw);
  return [crop.name, ...crop.aliases].some((n) => {
    const name = sound(n);
    if (hindi) return n.toLowerCase().includes(raw);
    return name.startsWith(q) || name.includes(` ${q}`) || nearWord(q, name);
  });
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

interface StepText {
  title: string;
  body: string;
}
/** A step on the crop page: the journey's own steps are named by key (app strings); care and material bring their texts. */
export interface GrowingStep {
  key: string;
  text?: StepText;
}

/** The order a crop goes through, from its journey shape and care steps. */
export function growingSteps(crop: {
  kind?: string;
  journey: 'NURSERY' | 'DIRECT' | 'PLANT';
  care: Array<{ key: string } & StepText>;
  material: StepText | null;
  thin_after_days: number | null;
}): GrowingStep[] {
  const care = crop.care.map((c) => ({ key: c.key, text: { title: c.title, body: c.body } }));
  const own = (...keys: string[]) => keys.map((key) => ({ key }));
  // A flower's journey ends in bloom, not harvest.
  const end = own(crop.kind === 'FLOWER' ? 'bloom' : 'harvest');
  if (crop.journey === 'NURSERY') return [...own('seeds', 'nursery', 'transplant'), ...care, ...end];
  if (crop.journey === 'DIRECT') return [...own('seeds', 'sow', ...(crop.thin_after_days ? ['thin'] : [])), ...care, ...end];
  const material = crop.material ? [{ key: 'material', text: crop.material }] : [];
  return [...material, ...own('plant'), ...care, ...end];
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
  journey: 'NURSERY' | 'DIRECT' | 'PLANT';
  germination_days: [number, number] | null;
  transplant_after_days: [number, number] | null;
  days_to_first_harvest: [number, number] | null;
  harvest_span_days: number | null;
}): CropFact[] {
  const flower = crop.kind === 'FLOWER';
  const facts: Array<CropFact | null> = [
    crop.germination_days ? { icon: 'psychiatry', labelKey: 'crops.detail.germinates', range: crop.germination_days } : null,
    crop.journey === 'NURSERY' && crop.transplant_after_days
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
