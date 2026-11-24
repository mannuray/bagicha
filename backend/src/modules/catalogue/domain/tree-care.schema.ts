import { z } from 'zod';
import type { FamilyCare, RegionCare, TreeCareSeed } from './tree-care';
import { hindiWords } from './words';
import { hindi, hindiText } from './hindi-text';
import type { CatalogueSeed } from './types';

const REGIONS = [
  'NORTH_INDIA',
  'EAST_INDIA',
  'WEST_INDIA',
  'CENTRAL_INDIA',
  'SOUTH_DECCAN',
  'COASTAL_HUMID',
  'HILLS_COOL',
] as const;
const region = z.enum(REGIONS);
const text = z.string().min(1);

/** Days per month; February counts 29 so a leap day is never uncovered. */
const DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const monthDay = z
  .tuple([z.number().int().min(1).max(12), z.number().int().min(1)])
  .refine(([m, d]) => d <= DAYS[m - 1], 'no such day in that month');

const days = z.number().int().min(0);
const calendar = z
  .object({ kind: z.literal('CALENDAR'), from: monthDay, to: monthDay })
  .strict();
const anchor = z.discriminatedUnion('kind', [
  calendar,
  z
    .object({ kind: z.literal('FROM_PLANTING'), fromDays: days, toDays: days })
    .strict()
    .refine((w) => w.fromDays <= w.toDays, 'the window ends before it starts'),
  z
    .object({
      kind: z.literal('FROM_CHOICE'),
      choice: text,
      fromDays: days,
      toDays: days,
    })
    .strict(),
]);
const stages = z.array(z.enum(['YOUNG', 'BEARING'])).min(1);
const dosePart = z
  .object({ what: text, grams: z.number().positive() })
  .strict();

const careItem = z
  .object({
    key: z.string().regex(/^[a-z][a-z0-9_]*$/),
    title: text.max(60),
    category: z.enum([
      'FEEDING',
      'PRUNING',
      'PROTECTION',
      'WATERING',
      'GENERAL',
    ]),
    stages,
    when: anchor,
    // Empty is valid: a fertiliser-only feed has no organic way.
    organic: z.string(),
    chemical: text.optional(),
    dose: z
      .object({
        organic: z.array(dosePart),
        chemical: z.array(dosePart),
        maxAgeYears: z.number().positive(),
        together: z.boolean().optional(),
      })
      .strict()
      .optional(),
    conditional: text.optional(),
    why: text,
    hi: hindi({
      title: hindiText.max(60).optional(),
      organic: hindiText.optional(),
      chemical: hindiText.optional(),
      why: hindiText.optional(),
      conditional: hindiText.optional(),
    }),
  })
  .strict()
  .refine(
    (i) => !(i.when.kind === 'FROM_PLANTING' && i.dose),
    // doseFor scales by whole years, wrong for a plant a few months old.
    'a dose scales by whole years of age; write a planting-timed amount in the text',
  );

const phaseWindow = z
  .object({
    // The engine places phases by the calendar only.
    when: calendar,
    stages,
    phase: z.string().regex(/^[a-z][a-z0-9_]*$/),
    avoid: z.array(text),
    watch: z.array(text),
    hi: hindi({
      avoid: z.array(hindiText).optional(),
      watch: z.array(hindiText).optional(),
    }),
  })
  .strict();

const regionCare = z
  .object({ items: z.array(careItem), phases: z.array(phaseWindow) })
  .strict();
const regionEntry = z.union([
  regionCare,
  z.object({ sameAs: region }).strict(),
]);

const careKind = z
  .object({
    key: z.string().regex(/^[a-z][a-z0-9_]*$/),
    words: z.array(text).min(1),
    varietyWords: z.array(text).optional(),
    grownIn: z.array(region).min(1),
    regions: z.partialRecord(region, regionEntry),
    pendingRegions: z.array(region).optional(),
  })
  .strict();

export const treeCareSeedSchema = z
  .object({
    family: z.string().regex(/^[a-z][a-z0-9_]*$/),
    sources: z.array(text).min(1),
    // Empty only for a family whose care is all in its kinds.
    grownIn: z.array(region),
    regions: z.partialRecord(region, regionEntry),
    pendingRegions: z.array(region).optional(),
    kinds: z.array(careKind).min(1).optional(),
    noKindWords: z.array(text).optional(),
    status: z.enum(['DRAFT', 'APPROVED', 'RETIRED']),
    notes: z.string().nullable(),
  })
  .strict();

/** The parts of a family or kind that say where it is grown and its care there. */
type Grown = Pick<FamilyCare, 'grownIn' | 'regions' | 'pendingRegions'>;

/**
 * Rules across a care record and the rest of the seed: one record per family,
 * on a known fruit type; `sameAs` one hop to real care; every grown region
 * covered or pending; an item's key plus window start unique in a region
 * (one written item with several windows expands to several with one key).
 * A family with kinds has no care of its own; its kinds have unique keys,
 * no word on two kinds, and each the same region rules.
 */
export function treeCareIssues(seed: CatalogueSeed): string[] {
  const issues: string[] = [];
  // Served care (approved or retired) needs a served fruit type: the API
  // loads only those, and would refuse to start on care for a missing type.
  const all = new Set(seed.fruitTypes.map((t) => t.key));
  const served = new Set(
    seed.fruitTypes.filter((t) => t.status !== 'DRAFT').map((t) => t.key),
  );
  const seen = new Set<string>();
  for (const care of seed.treeCare) {
    if (seen.has(care.family))
      issues.push(`duplicate tree care: ${care.family}`);
    seen.add(care.family);
    const types = care.status === 'DRAFT' ? all : served;
    if (!types.has(care.family))
      issues.push(
        `${care.family}: tree care for an unknown or draft fruit type`,
      );
    issues.push(...(care.kinds ? kindIssues(care) : familyIssues(care)));
  }
  return issues;
}

function familyIssues(care: TreeCareSeed): string[] {
  return care.grownIn.length === 0
    ? [`${care.family}: grown nowhere (grownIn is empty and it has no kinds)`]
    : regionIssues(care.family, care);
}

function kindIssues(care: TreeCareSeed): string[] {
  const kinds = care.kinds ?? [];
  const issues: string[] = [];
  if (
    care.grownIn.length > 0 ||
    Object.keys(care.regions).length > 0 ||
    care.pendingRegions
  )
    issues.push(
      `${care.family}: a family with kinds has no grownIn, regions or pendingRegions of its own`,
    );
  const keys = new Set<string>();
  const words = new Map<string, string>();
  for (const kind of kinds) {
    if (keys.has(kind.key))
      issues.push(`${care.family}: duplicate kind ${kind.key}`);
    keys.add(kind.key);
    for (const word of [...kind.words, ...(kind.varietyWords ?? [])]) {
      const normal = hindiWords(word);
      const other = words.get(normal);
      if (other && other !== kind.key)
        issues.push(
          `${care.family}: word "${word}" is on kinds ${other} and ${kind.key}`,
        );
      words.set(normal, kind.key);
    }
    issues.push(...regionIssues(`${care.family}:${kind.key}`, kind));
  }
  return issues;
}

function regionIssues(label: string, care: Grown): string[] {
  const issues: string[] = [];
  const own = (r: string): RegionCare | null => {
    const entry = care.regions[r as keyof typeof care.regions];
    return entry && 'items' in entry ? entry : null;
  };
  for (const [name, entry] of Object.entries(care.regions)) {
    if (entry && 'sameAs' in entry && !own(entry.sameAs))
      issues.push(
        `${label}: ${name} sameAs ${entry.sameAs} must point at a region with its own care`,
      );
    const regionCare = own(name);
    if (!regionCare) continue;
    for (const phase of regionCare.phases)
      for (const list of ['avoid', 'watch'] as const) {
        const hi = phase.hi?.[list];
        if (hi && hi.length !== phase[list].length)
          issues.push(
            `${label}: ${name} phase ${phase.phase}: Hindi ${list} differs in number from the English`,
          );
      }
    const keys = new Set<string>();
    for (const item of regionCare.items) {
      const when = item.when;
      const start =
        when.kind === 'CALENDAR'
          ? when.from.join('-')
          : when.kind === 'FROM_PLANTING'
            ? `day ${when.fromDays} after planting`
            : `day ${when.fromDays} after ${when.choice}`;
      const id = `${item.key}@${start}`;
      if (keys.has(id))
        issues.push(`${label}: ${name} repeats ${item.key} from ${start}`);
      keys.add(id);
    }
  }
  const pending = new Set(care.pendingRegions ?? []);
  for (const r of care.grownIn)
    if (!pending.has(r) && !care.regions[r])
      issues.push(`${label}: grown in ${r} with no care and not pending`);
  return issues;
}
