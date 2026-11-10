import { describe, expect, it } from 'vitest';
import type { PlantDetail } from '../plants';
import { plantRecord } from '../../test/fixtures';
import { formatRange, lifeLine } from './life-line';

const NOW = new Date('2026-11-10T06:00:00Z');
const MANGO = { first_fruit_months: [36, 60], productive_until_months: [480, 720], lifespan_months: [720, 1200], note_key: null };
const PAPAYA = { first_fruit_months: [8, 12], productive_until_months: [24, 36], lifespan_months: [48, 72], note_key: 'papaya' };
const plant = (over: Record<string, unknown>) =>
  ({
    ...plantRecord(),
    _count: { journal_entries: 0 },
    first_flowering_at: null, first_fruit_set_at: null, first_harvest_at: null, latest_harvest_at: null,
    planted_context: 'GROUND', life_profile: MANGO,
    ...over,
  }) as unknown as PlantDetail;

describe('formatRange', () => {
  it('uses months under two years, years otherwise', () => {
    expect(formatRange([8, 12])).toEqual({ unit: 'months', min: 8, max: 12 });
    expect(formatRange([24, 36])).toEqual({ unit: 'years', min: 2, max: 3 });
    expect(formatRange([480, 720])).toEqual({ unit: 'years', min: 40, max: 60 });
  });
});

describe('lifeLine', () => {
  it('before first fruit, says when fruit usually comes', () => {
    const line = lifeLine(plant({ life_profile: PAPAYA, planting_date: '2026-07-01T00:00:00.000Z', planting_date_precision: 'MONTH_YEAR' }), NOW);
    expect(line).toMatchObject({ phase: 'beforeFruit', range: { unit: 'months', min: 8, max: 12 }, noteKey: 'papaya', container: false });
  });

  it('in its productive years, gives the age and the usual productive span', () => {
    const line = lifeLine(plant({ planting_date: '2015-01-01T00:00:00.000Z', planting_date_precision: 'YEAR' }), NOW);
    expect(line).toMatchObject({ phase: 'productive', age: { unit: 'years', count: 11 }, range: { unit: 'years', min: 40, max: 60 } });
  });

  it('past the productive age, suggests a replacement', () => {
    const line = lifeLine(plant({ life_profile: PAPAYA, planting_date: '2022-06-01T00:00:00.000Z', planting_date_precision: 'MONTH_YEAR' }), NOW);
    expect(line).toMatchObject({ phase: 'past', range: { unit: 'years', min: 2, max: 3 } });
  });

  it('in a pot, never says past and gives no productive span', () => {
    const line = lifeLine(plant({ planted_context: 'POT', planting_date: '2015-01-01T00:00:00.000Z', planting_date_precision: 'YEAR' }), NOW);
    expect(line).toMatchObject({ phase: 'productive', container: true, range: null });
    const oldPapaya = lifeLine(plant({ planted_context: 'GROW_BAG', life_profile: PAPAYA, planting_date: '2022-06-01T00:00:00.000Z', planting_date_precision: 'MONTH_YEAR' }), NOW);
    expect(oldPapaya?.phase).toBe('productive');
  });

  it('a recorded harvest means productive, even when young', () => {
    const line = lifeLine(plant({ planting_date: '2024-11-01T00:00:00.000Z', planting_date_precision: 'MONTH_YEAR', first_harvest_at: '2026-06-01T00:00:00.000Z' }), NOW);
    expect(line?.phase).toBe('productive');
  });

  it('says nothing without a profile or a planting date', () => {
    expect(lifeLine(plant({ life_profile: null }), NOW)).toBeNull();
    expect(lifeLine(plant({ planting_date: null, planting_date_precision: 'UNKNOWN' }), NOW)).toBeNull();
  });
});
