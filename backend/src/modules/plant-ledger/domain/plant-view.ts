import { pickFields } from '../../../common/http/pick-fields';

/** The plant columns clients see — every column except the owner id and bookkeeping. */
export const PLANT_FIELDS = [
  'id',
  'name',
  'species_family',
  'species',
  'variety',
  'record_kind',
  'type',
  'growth_habit',
  'record_pattern',
  'lifecycle_stage',
  'lifecycle_stage_manual',
  'planted_context',
  'planting_date',
  'planting_date_precision',
  'planting_date_input',
  'first_flowering_at',
  'first_fruit_set_at',
  'first_harvest_at',
  'latest_harvest_at',
  'bearing_status',
  'bearing_since_year',
  'health_status',
  'ended_at',
  'end_reason',
  'end_note',
  'end_entry_id',
  'replaced_by_id',
  'crop_id',
  'crop_stage',
  'created_at',
] as const;

/** What a list row or the detail page adds beside the columns. */
const PLANT_EXTRAS = [
  'season_started_at',
  '_count',
  'life_profile',
  'bloom',
  'replaced_by',
  'replaces',
] as const;

type PlantLike = { [K in (typeof PLANT_FIELDS)[number]]?: unknown } & {
  [K in (typeof PLANT_EXTRAS)[number]]?: unknown;
};

/** A plant as clients see it, built field by field. */
export function toPlantView<T extends PlantLike>(plant: T) {
  return pickFields(plant, [
    ...PLANT_FIELDS,
    ...PLANT_EXTRAS,
  ] as unknown as readonly (keyof T)[]);
}
