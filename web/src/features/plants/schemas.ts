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

export const plantDetailSchema = plantSchema.extend({
  _count: z.object({ journal_entries: z.number() }),
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
