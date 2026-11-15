import { z } from 'zod';
import { ValidationError } from '../../../common/errors';
import type { CatalogueSeed } from './types';

const status = z.enum(['DRAFT', 'APPROVED', 'RETIRED']);
const month = z.number().int().min(1).max(12);
const range = z.tuple([z.number().int().min(0), z.number().int().min(0)]);
const windows = z.array(z.tuple([month, month]));
const text = z.string().min(1);
/** A Hindi text: non-empty, with Devanagari in it. */
const hindiText = z
  .string()
  .min(1)
  .regex(/[\u0900-\u097F]/, 'needs Devanagari');
/** Optional Hindi versions of some of a record's texts; no other keys. */
const hindi = <T extends z.ZodRawShape>(shape: T) =>
  z.object(shape).strict().optional();

export const cropSeedSchema = z
  .object({
    id: z.string().regex(/^[a-z][a-z0-9_]*$/),
    kind: z.enum(['CROP', 'FLOWER']),
    name: text,
    aliases: z.array(text),
    family: z.string().regex(/^[A-Z]+$/),
    method: text,
    windows: z
      .object({ PLAINS: windows, PENINSULAR: windows, HILLS: windows })
      .strict(),
    germination_days: range,
    transplant_after_days: range.nullable(),
    days_to_first_harvest: range,
    harvest_by_group: z
      .object({
        PLAINS: range.optional(),
        PENINSULAR: range.optional(),
        HILLS: range.optional(),
      })
      .strict()
      .optional(),
    harvest_span_days: z.number().int().min(0),
    thin_after_days: z.number().int().min(0).nullable(),
    succession_every_days: z.number().int().min(0).nullable(),
    care: z.array(
      z
        .object({
          key: text,
          after: z.enum(['SOWING', 'TRANSPLANTING']),
          days: z.number().int().min(0),
        })
        .strict(),
    ),
    tags: z.array(z.enum(['container', 'beginner'])),
    guide: z
      .object({
        plants_for_family_of_4: text,
        container: text,
        spacing_cm: range,
      })
      .strict(),
    scientific_name: text,
    description: text,
    sun: z.enum(['FULL', 'PARTIAL']),
    hi: hindi({
      name: hindiText.optional(),
      description: hindiText.optional(),
      container: hindiText.optional(),
      plants_for_family_of_4: hindiText.optional(),
    }),
    status,
    notes: z.string().nullable(),
  })
  .strict();

export const methodSeedSchema = z
  .object({
    key: z.string().regex(/^[A-Z][A-Z_]*$/),
    journey: z.enum(['NURSERY', 'DIRECT', 'PLANT']),
    material: text.nullable(),
    label: text,
    short: text,
    material_title: text.nullable(),
    material_body: text.nullable(),
    hi: hindi({
      label: hindiText.optional(),
      short: hindiText.optional(),
      material_title: hindiText.optional(),
      material_body: hindiText.optional(),
    }),
    status,
  })
  .strict();

export const careStepSeedSchema = z
  .object({
    key: z.string().regex(/^[a-z][a-z_]*$/),
    title: z.string().includes('{name}'),
    label_title: text,
    label_body: text,
    hi: hindi({
      label_title: hindiText.optional(),
      label_body: hindiText.optional(),
    }),
    status,
  })
  .strict();

const ordered = range.refine(([min, max]) => min <= max, 'min above max');
const byGroup = <T extends z.ZodType>(item: T) =>
  z.object({ PLAINS: item, PENINSULAR: item, HILLS: item }).strict();
const familyKey = z.string().regex(/^[a-z][a-z0-9_]*$/);
/** A fruit word as the matcher compares it: lower-case Latin letters and digits, single spaces. */
const fruitWord = z.string().regex(/^[a-z0-9]+( [a-z0-9]+)*$/);
/** A flower alias as the matcher compares it: lower-case letters (any script) and digits, single spaces. */
const flowerWord = z
  .string()
  .regex(/^[\p{L}\p{M}0-9]+( [\p{L}\p{M}0-9]+)*$/u)
  .refine((w) => w === w.toLowerCase(), 'must be lower-case');

export const fruitTypeSeedSchema = z
  .object({
    key: familyKey,
    match_aliases: z.array(fruitWord).min(1),
    life: z
      .object({
        first_fruit_months: ordered,
        productive_until_months: ordered,
        lifespan_months: ordered,
        note_key: text.nullable(),
      })
      .strict(),
    status,
    notes: z.string().nullable(),
  })
  .strict();

export const fruitPlantSeedSchema = z
  .object({
    key: z.string().regex(/^[a-z][a-z0-9_]*(:.+)?$/),
    species_family: familyKey,
    species: text,
    variety: text.nullable(),
    display_name: text,
    plant_type: text,
    aliases: z.array(text),
    languages: z.record(z.string(), z.array(text)).nullable(),
    regions: z.array(text),
    confidence_weight: z.number().min(0).max(1),
    hi: hindi({ display_name: hindiText.optional() }),
    status,
    notes: z.string().nullable(),
  })
  .strict();

export const perennialFlowerSeedSchema = z
  .object({
    family: familyKey,
    name: text,
    aliases: z.array(flowerWord).min(1),
    bloom: byGroup(windows),
    care: byGroup(
      z.array(
        z
          .object({
            key: text,
            month,
            title: text,
            category: z.enum(['PRUNING', 'FEEDING', 'GENERAL']),
          })
          .strict(),
      ),
    ),
    first_bloom_months: ordered,
    lifespan_months: ordered,
    note_key: text.nullable(),
    hi: hindi({ name: hindiText.optional() }),
    status,
    notes: z.string().nullable(),
  })
  .strict();

const seedSchema = z
  .object({
    crops: z.array(cropSeedSchema),
    methods: z.array(methodSeedSchema),
    careSteps: z.array(careStepSeedSchema),
    fruitTypes: z.array(fruitTypeSeedSchema),
    fruitPlants: z.array(fruitPlantSeedSchema),
    perennialFlowers: z.array(perennialFlowerSeedSchema),
  })
  .strict();

/**
 * Checks a whole seed (or what was read back from the database): every
 * record's shape, unique keys, and that each crop's method and care steps exist.
 */
export function validateSeed(input: unknown): CatalogueSeed {
  const parsed = seedSchema.safeParse(input);
  if (!parsed.success)
    throw invalid(
      parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    );
  const seed = parsed.data;
  const issues = [
    ...duplicates(
      seed.crops.map((c) => c.id),
      'crop',
    ),
    ...duplicates(
      seed.methods.map((m) => m.key),
      'method',
    ),
    ...duplicates(
      seed.careSteps.map((s) => s.key),
      'care step',
    ),
  ];
  // A crop the API serves (approved or retired) may only use methods and care
  // steps the API also serves: the API loads only non-draft records.
  const keys = (
    records: Array<{ key: string; status: string }>,
    all: boolean,
  ) =>
    new Set(
      records.filter((r) => all || r.status !== 'DRAFT').map((r) => r.key),
    );
  for (const crop of seed.crops) {
    const draft = crop.status === 'DRAFT';
    const methods = keys(seed.methods, draft);
    const steps = keys(seed.careSteps, draft);
    if (!methods.has(crop.method))
      issues.push(`${crop.id}: unknown or draft method ${crop.method}`);
    for (const c of crop.care)
      if (!steps.has(c.key))
        issues.push(`${crop.id}: unknown or draft care step ${c.key}`);
  }
  issues.push(...fruitAndFlowerIssues(seed));
  if (issues.length > 0) throw invalid(issues);
  return seed;
}

/** Keys unique, entries keyed by their variety, served entries on served types, no alias on two flowers. */
function fruitAndFlowerIssues(seed: CatalogueSeed): string[] {
  const issues = [
    ...duplicates(
      seed.fruitTypes.map((t) => t.key),
      'fruit type',
    ),
    ...duplicates(
      seed.fruitPlants.map((p) => p.key),
      'fruit plant',
    ),
    ...duplicates(
      seed.perennialFlowers.map((f) => f.family),
      'perennial flower',
    ),
    ...duplicates(
      seed.perennialFlowers.flatMap((f) => f.aliases),
      'perennial flower alias',
    ),
    // A later type's word would never match: the first type with it wins.
    ...duplicates(
      seed.fruitTypes.flatMap((t) => t.match_aliases),
      'fruit word',
    ),
    // Life profiles and search ids are looked up by family across both kinds.
    ...duplicates(
      [
        ...seed.fruitTypes.map((t) => t.key),
        ...seed.perennialFlowers.map((f) => f.family),
      ],
      'family shared by a fruit type and a flower:',
    ),
  ];
  const served = new Set(
    seed.fruitTypes.filter((t) => t.status !== 'DRAFT').map((t) => t.key),
  );
  const all = new Set(seed.fruitTypes.map((t) => t.key));
  for (const plant of seed.fruitPlants) {
    const want = plant.variety
      ? `${plant.species_family}:${plant.variety}`
      : plant.species_family;
    if (plant.key !== want) issues.push(`${plant.key}: key should be ${want}`);
    const types = plant.status === 'DRAFT' ? all : served;
    if (!types.has(plant.species_family))
      issues.push(
        `${plant.key}: unknown or draft fruit type ${plant.species_family}`,
      );
  }
  return issues;
}

function duplicates(keys: string[], what: string): string[] {
  const seen = new Set<string>();
  return keys.flatMap((k) => {
    if (!seen.has(k)) {
      seen.add(k);
      return [];
    }
    return [`duplicate ${what} ${k}`];
  });
}

const invalid = (issues: string[]) =>
  new ValidationError('CATALOGUE_INVALID', 'The catalogue is not valid', {
    issues,
  });
