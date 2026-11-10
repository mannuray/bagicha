import { z } from 'zod';

export const plantSchema = z.object({
  id: z.string(),
  name: z.string(),
  species: z.string(),
  species_family: z.string().nullable(),
  variety: z.string().nullable(),
  record_kind: z.enum(['TREE', 'FLOWER', 'CROP']),
  type: z.string(),
  growth_habit: z.string(),
  record_pattern: z.string(),
  lifecycle_stage: z.enum(['SAPLING', 'JUVENILE', 'FIRST_FLOWERING', 'FIRST_HARVEST', 'MATURE_BEARING']),
  lifecycle_stage_manual: z.boolean(),
  planting_date: z.string().nullable(),
  planting_date_precision: z.enum(['EXACT_DATE', 'MONTH_YEAR', 'YEAR', 'UNKNOWN']),
  planting_date_input: z.string().nullable(),
  health_status: z.string(),
  created_at: z.string(),
});
export type Plant = z.infer<typeof plantSchema>;

const milestone = z
  .string()
  .nullable()
  .optional()
  .transform((v) => v ?? null);

export const plantDetailSchema = plantSchema.extend({
  _count: z.object({ journal_entries: z.number() }),
  first_flowering_at: milestone,
  first_fruit_set_at: milestone,
  first_harvest_at: milestone,
  latest_harvest_at: milestone,
});
export type PlantDetail = z.infer<typeof plantDetailSchema>;

export const catalogueItemSchema = z.object({
  id: z.string(),
  display_name: z.string(),
  species_family: z.string(),
  species: z.string(),
  variety: z.string().nullable(),
  plant_type: z.string(),
});
export type CatalogueItem = z.infer<typeof catalogueItemSchema>;

export const resolveSchema = z.object({
  match: catalogueItemSchema.extend({ matched_alias: z.string().nullable() }).nullable(),
  confidence: z.enum(['high', 'medium', 'low']),
});

export interface PlantInput {
  name: string;
  species: string;
  variety?: string | null;
  record_kind: 'TREE' | 'FLOWER' | 'CROP';
  planting_date?: string | null;
  planting_date_precision?: 'EXACT_DATE' | 'MONTH_YEAR' | 'YEAR' | 'UNKNOWN';
}

const stringList = z.array(z.string());

export const cycleSchema = z.object({
  id: z.string(),
  cycle_year: z.number(),
  observed_flowering_at: z.string().nullable(),
  observed_fruit_set_at: z.string().nullable(),
  harvest_started_at: z.string().nullable(),
  harvest_completed_at: z.string().nullable(),
  yield_quantity: z.number().nullable(),
  yield_unit: z.string().nullable(),
  yield_quality: z.string(),
  flower_drop_level: z.string(),
  fruit_drop_level: z.string(),
  stress_score: z.number().nullable(),
  pest_pressure_score: z.number().nullable(),
  treatment_count: z.number(),
  cycle_summary: z.string().nullable(),
  recommended_next_cycle_actions: z.unknown(),
});
export type Cycle = z.infer<typeof cycleSchema>;

export const mitigationSchema = z.object({
  cycle_year: z.number().nullable(),
  summary: z.string(),
  likely_issues: stringList,
  what_to_change: stringList,
  watch_early: stringList,
  priority_actions: stringList,
  completed_tasks: z.number(),
  skipped_tasks: z.number(),
  pending_tasks: z.number(),
});
export type MitigationPlan = z.infer<typeof mitigationSchema>;
