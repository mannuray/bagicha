import { describe, expect, it } from 'vitest';
import type { PlantDetail } from '../plants';
import { plantRecord } from '../../test/fixtures';
import { memoryFor } from './memory';

const NOW = new Date('2026-11-10T06:00:00Z');
const plant = (over: Record<string, unknown>) =>
  ({ ...plantRecord(), _count: { journal_entries: 0 }, first_flowering_at: null, first_fruit_set_at: null, first_harvest_at: null, latest_harvest_at: null, ...over }) as unknown as PlantDetail;

describe('memoryFor', () => {
  it('remembers the planting month', () => {
    expect(memoryFor(plant({ planting_date: '2015-11-04T00:00:00.000Z', planting_date_precision: 'MONTH_YEAR' }), NOW)).toEqual({ kind: 'planted', years: 11 });
  });
  it('needs a known planting month', () => {
    expect(memoryFor(plant({ planting_date: '2015-01-01T00:00:00.000Z', planting_date_precision: 'YEAR' }), NOW)).toBeNull();
  });
  it('remembers the first harvest month in a later year', () => {
    expect(memoryFor(plant({ planting_date: null, planting_date_precision: 'UNKNOWN', first_harvest_at: '2023-11-20T00:00:00.000Z' }), NOW)).toEqual({ kind: 'firstHarvest', years: 3 });
  });
  it('says nothing in the same year', () => {
    expect(memoryFor(plant({ planting_date: '2026-11-01T00:00:00.000Z', planting_date_precision: 'EXACT_DATE', first_harvest_at: '2026-11-02T00:00:00.000Z' }), NOW)).toBeNull();
  });
  it('prefers the planting memory when both apply', () => {
    expect(memoryFor(plant({ planting_date: '2015-11-04T00:00:00.000Z', planting_date_precision: 'EXACT_DATE', first_harvest_at: '2020-11-04T00:00:00.000Z' }), NOW)?.kind).toBe('planted');
  });
});
