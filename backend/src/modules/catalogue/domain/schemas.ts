import { z } from 'zod';
import { ValidationError } from '../../../common/errors';
import type { CatalogueSeed } from './types';

const status = z.enum(['DRAFT', 'APPROVED', 'RETIRED']);
const month = z.number().int().min(1).max(12);
const range = z.tuple([z.number().int().min(0), z.number().int().min(0)]);
const windows = z.array(z.tuple([month, month]));
const text = z.string().min(1);

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
    status,
  })
  .strict();

export const careStepSeedSchema = z
  .object({
    key: z.string().regex(/^[a-z][a-z_]*$/),
    title: z.string().includes('{name}'),
    label_title: text,
    label_body: text,
    status,
  })
  .strict();

const seedSchema = z
  .object({
    crops: z.array(cropSeedSchema),
    methods: z.array(methodSeedSchema),
    careSteps: z.array(careStepSeedSchema),
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
  if (issues.length > 0) throw invalid(issues);
  return seed;
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
