import { describe, expect, it } from 'vitest';
import { plantRecord } from '../../test/fixtures';
import type { PlantDetail } from './schemas';
import { diff, emptyForm, fromPlant, toInput, validate, type FormState } from './form';

const form = (over: Partial<FormState>): FormState => ({ ...emptyForm, name: 'Aam', species: 'Mango', ...over });

describe('the tree form, as pure functions', () => {
  it('toInput trims, nulls blanks and marks a missing date UNKNOWN', () => {
    expect(toInput(form({ name: ' Aam ', variety: '  ' }))).toMatchObject({
      name: 'Aam', variety: null, planting_date: null, planting_date_precision: 'UNKNOWN', bearing_status: null, bearing_since_year: null,
    });
  });

  it('sends the fruiting answer for trees only, and a since-year only with Yes and four digits', () => {
    expect(toInput(form({ bearing: 'BEARING', since: '2019' }))).toMatchObject({ bearing_status: 'BEARING', bearing_since_year: 2019 });
    expect(toInput(form({ bearing: 'NOT_YET', since: '2019' }))).toMatchObject({ bearing_status: 'NOT_YET', bearing_since_year: null });
    expect(toInput(form({ bearing: 'BEARING', since: '19' }))).toMatchObject({ bearing_since_year: null });
    expect(toInput(form({ record_kind: 'FLOWER', bearing: 'BEARING', since: '2019' }))).toMatchObject({ bearing_status: null, bearing_since_year: null });
  });

  it('fromPlant round-trips through toInput unchanged, so an untouched edit sends nothing', () => {
    const plant = { ...plantRecord(), bearing_status: 'BEARING', bearing_since_year: 2019 } as unknown as PlantDetail;
    const initial = toInput(fromPlant(plant));
    expect(diff(initial, toInput(fromPlant(plant)))).toEqual({});
  });

  it('diff keeps only the changed fields', () => {
    expect(diff(toInput(form({})), toInput(form({ name: 'Old Aam' })))).toEqual({ name: 'Old Aam' });
  });

  it('validate names the missing required fields', () => {
    expect(validate(form({}))).toEqual({});
    expect(validate(form({ name: ' ', species: '' }))).toEqual({ name: 'plants.form.nameRequired', species: 'plants.form.speciesRequired' });
  });
});
