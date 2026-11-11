import { describe, expect, it } from 'vitest';
import type { PlantDetail } from '../plants';
import { plantRecord } from '../../test/fixtures';
import { milestoneView } from './milestone-view';

const NOW = new Date('2026-11-11T06:00:00Z');
const MANGO = { first_fruit_months: [36, 60], productive_until_months: [480, 720], lifespan_months: [720, 1200], note_key: null };
const BANANA = { first_fruit_months: [9, 15], productive_until_months: [36, 60], lifespan_months: [60, 96], note_key: 'banana' };
const plant = (over: Record<string, unknown>) =>
  ({
    ...plantRecord(),
    _count: { journal_entries: 0 },
    first_flowering_at: null, first_fruit_set_at: null, first_harvest_at: null, latest_harvest_at: null,
    planting_date: '2017-01-01T00:00:00.000Z', planting_date_precision: 'YEAR',
    bearing_status: null, bearing_since_year: null, life_profile: MANGO,
    ...over,
  }) as unknown as PlantDetail;

describe('milestoneView: what a "first" card says', () => {
  it('a recorded date always wins', () => {
    expect(milestoneView(plant({ first_harvest_at: '2024-05-01T00:00:00.000Z', bearing_status: 'BEARING' }), 'firstHarvest', NOW))
      .toEqual({ kind: 'recorded', at: '2024-05-01T00:00:00.000Z' });
  });

  it('"already fruits, since 2019" → since 2019; without a year → before Bagicha', () => {
    expect(milestoneView(plant({ bearing_status: 'BEARING', bearing_since_year: 2019 }), 'firstFlowering', NOW)).toEqual({ kind: 'since', year: 2019 });
    expect(milestoneView(plant({ bearing_status: 'BEARING' }), 'firstFruitSet', NOW)).toEqual({ kind: 'before' });
  });

  it('not sure, and older than the latest usual first fruit → an estimate from the planted year', () => {
    // A bare year spans the whole year: earliest 1 Jan 2017 + 3 y, latest 31 Dec 2017 + 5 y.
    expect(milestoneView(plant({}), 'firstHarvest', NOW)).toEqual({ kind: 'estimate', from: 2020, to: 2023 });
  });

  it('rounds month ranges outward (banana 9–15 months)', () => {
    expect(milestoneView(plant({ life_profile: BANANA, planting_date: '2020-01-01T00:00:00.000Z' }), 'firstHarvest', NOW))
      .toEqual({ kind: 'estimate', from: 2020, to: 2022 });
  });

  it('young, "not yet", no profile or no planting date → not yet', () => {
    expect(milestoneView(plant({ planting_date: '2025-01-01T00:00:00.000Z' }), 'firstHarvest', NOW)).toEqual({ kind: 'notYet' });
    expect(milestoneView(plant({ bearing_status: 'NOT_YET' }), 'firstHarvest', NOW)).toEqual({ kind: 'notYet' });
    expect(milestoneView(plant({ life_profile: null }), 'firstHarvest', NOW)).toEqual({ kind: 'notYet' });
    expect(milestoneView(plant({ planting_date: null, planting_date_precision: 'UNKNOWN' }), 'firstHarvest', NOW)).toEqual({ kind: 'notYet' });
  });

  it('a bare planted year counts from its end: banana "2025" is not past first fruit in Nov 2026', () => {
    expect(milestoneView(plant({ life_profile: BANANA, planting_date: '2025-01-01T00:00:00.000Z', planting_date_precision: 'YEAR' }), 'firstHarvest', NOW))
      .toEqual({ kind: 'notYet' });
  });

  it('never estimates a year that has not come yet', () => {
    const view = milestoneView(
      plant({ life_profile: BANANA, planting_date: '2025-06-01T00:00:00.000Z', planting_date_precision: 'MONTH_YEAR' }),
      'firstHarvest',
      NOW,
    );
    expect(view).toEqual({ kind: 'estimate', from: 2026, to: 2026 });
  });
});

describe('plantedView', () => {
  it('a bare year, a month and year, or unknown', async () => {
    const { plantedView } = await import('./milestone-view');
    expect(plantedView(plant({ planting_date: '2017-01-01T00:00:00.000Z', planting_date_precision: 'YEAR' }))).toEqual({ kind: 'year', year: 2017 });
    expect(plantedView(plant({ planting_date: '2024-03-01T00:00:00.000Z', planting_date_precision: 'MONTH_YEAR' }))).toEqual({ kind: 'date', at: '2024-03-01T00:00:00.000Z' });
    expect(plantedView(plant({ planting_date: null, planting_date_precision: 'UNKNOWN' }))).toEqual({ kind: 'unknown' });
  });
});
