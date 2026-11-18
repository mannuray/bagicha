import { z } from 'zod';
import type { RegionCare, TreeCareSeed } from './tree-care';
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
const anchor = z.discriminatedUnion('kind', [
  z
    .object({ kind: z.literal('CALENDAR'), from: monthDay, to: monthDay })
    .strict(),
  z
    .object({ kind: z.literal('FROM_PLANTING'), fromDays: days, toDays: days })
    .strict(),
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
  })
  .strict();

const phaseWindow = z
  .object({
    when: anchor,
    stages,
    phase: z.string().regex(/^[a-z][a-z0-9_]*$/),
    avoid: z.array(text),
    watch: z.array(text),
  })
  .strict();

const regionCare = z
  .object({ items: z.array(careItem), phases: z.array(phaseWindow) })
  .strict();
const regionEntry = z.union([
  regionCare,
  z.object({ sameAs: region }).strict(),
]);

export const treeCareSeedSchema = z
  .object({
    family: z.string().regex(/^[a-z][a-z0-9_]*$/),
    sources: z.array(text).min(1),
    grownIn: z.array(region).min(1),
    regions: z.partialRecord(region, regionEntry),
    pendingRegions: z.array(region).optional(),
    status: z.enum(['DRAFT', 'APPROVED', 'RETIRED']),
    notes: z.string().nullable(),
  })
  .strict();

/**
 * Rules across a care record and the rest of the seed: one record per family,
 * on a known fruit type; `sameAs` one hop to real care; every grown region
 * covered or pending; an item's key plus window start unique in a region
 * (one written item with several windows expands to several with one key).
 */
export function treeCareIssues(seed: CatalogueSeed): string[] {
  const issues: string[] = [];
  const types = new Set(seed.fruitTypes.map((t) => t.key));
  const seen = new Set<string>();
  for (const care of seed.treeCare) {
    if (seen.has(care.family))
      issues.push(`duplicate tree care: ${care.family}`);
    seen.add(care.family);
    if (!types.has(care.family))
      issues.push(`${care.family}: tree care for an unknown fruit type`);
    issues.push(...regionIssues(care));
  }
  return issues;
}

function regionIssues(care: TreeCareSeed): string[] {
  const issues: string[] = [];
  const own = (r: string): RegionCare | null => {
    const entry = care.regions[r as keyof typeof care.regions];
    return entry && 'items' in entry ? entry : null;
  };
  for (const [name, entry] of Object.entries(care.regions)) {
    if (entry && 'sameAs' in entry && !own(entry.sameAs))
      issues.push(
        `${care.family}: ${name} sameAs ${entry.sameAs} must point at a region with its own care`,
      );
    const regionCare = own(name);
    if (!regionCare) continue;
    const keys = new Set<string>();
    for (const item of regionCare.items) {
      const start =
        item.when.kind === 'CALENDAR'
          ? item.when.from.join('-')
          : item.when.kind;
      const id = `${item.key}@${start}`;
      if (keys.has(id))
        issues.push(
          `${care.family}: ${name} repeats ${item.key} from ${start}`,
        );
      keys.add(id);
    }
  }
  const pending = new Set(care.pendingRegions ?? []);
  for (const r of care.grownIn)
    if (!pending.has(r) && !care.regions[r])
      issues.push(`${care.family}: grown in ${r} with no care and not pending`);
  return issues;
}
