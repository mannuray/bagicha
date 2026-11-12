import { pickFields } from '../../../common/http/pick-fields';

/** A journal entry as its owner sees it. */
const ENTRY_FIELDS = [
  'id',
  'plant_id',
  'plant_cycle_id',
  'diagnosis_outcome_id',
  'type',
  'content',
  'metadata',
  'timestamp',
  'recorded_at',
] as const;

export const toEntryView = <
  T extends { [K in (typeof ENTRY_FIELDS)[number]]?: unknown },
>(
  entry: T,
) => pickFields(entry, ENTRY_FIELDS as unknown as readonly (keyof T)[]);
