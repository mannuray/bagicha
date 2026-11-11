import type { PlantDetail, PlantInput } from './schemas';

/** The add / edit tree form as data: state shape, conversions and checks (no React). */

export type Precision = 'YEAR' | 'MONTH_YEAR' | 'EXACT_DATE';
export interface FormState {
  name: string;
  species: string;
  variety: string;
  record_kind: PlantInput['record_kind'];
  precision: Precision;
  date: string;
  /** "Has it fruited yet?" — null is "Not sure". */
  bearing: 'BEARING' | 'NOT_YET' | null;
  since: string;
}

export const emptyForm: FormState = { name: '', species: '', variety: '', record_kind: 'TREE', precision: 'YEAR', date: '', bearing: null, since: '' };

export function fromPlant(p: PlantDetail): FormState {
  const precision: Precision =
    p.planting_date_precision === 'MONTH_YEAR' || p.planting_date_precision === 'EXACT_DATE' ? p.planting_date_precision : 'YEAR';
  return {
    name: p.name,
    species: p.species,
    variety: p.variety ?? '',
    record_kind: p.record_kind,
    precision,
    date: p.planting_date_input ?? '',
    bearing: p.bearing_status,
    since: p.bearing_since_year ? String(p.bearing_since_year) : '',
  };
}

export function toInput(f: FormState): PlantInput {
  return {
    name: f.name.trim(),
    species: f.species.trim(),
    variety: f.variety.trim() || null,
    record_kind: f.record_kind,
    planting_date: f.date.trim() || null,
    planting_date_precision: f.date.trim() ? f.precision : 'UNKNOWN',
    // Trees only; a since-year only with "Yes".
    bearing_status: f.record_kind === 'TREE' ? f.bearing : null,
    bearing_since_year: f.record_kind === 'TREE' && f.bearing === 'BEARING' && /^\d{4}$/.test(f.since.trim()) ? Number(f.since.trim()) : null,
  };
}

/** Only fields that actually changed, so an edit never rewrites what the user didn't touch. */
export function diff(before: PlantInput, after: PlantInput): Partial<PlantInput> {
  const out: Partial<PlantInput> = {};
  for (const key of Object.keys(after) as Array<keyof PlantInput>) {
    if (after[key] !== before[key]) Object.assign(out, { [key]: after[key] });
  }
  return out;
}

export type FormErrors = Partial<Record<'name' | 'species', string>>;

/** The required fields that are blank, as translation keys. */
export function validate(f: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!f.name.trim()) errors.name = 'plants.form.nameRequired';
  if (!f.species.trim()) errors.species = 'plants.form.speciesRequired';
  return errors;
}
