import { describe, expect, it } from 'vitest';
import { plantAge } from './plant-age';

const NOW = new Date('2026-11-10T06:00:00Z');

describe('plantAge', () => {
  it('counts whole years from a year-only date', () => {
    expect(plantAge('2015-01-01T00:00:00.000Z', 'YEAR', NOW)).toEqual({ unit: 'years', count: 11, year: 2015 });
  });
  it('counts months for a planting under a year old', () => {
    expect(plantAge('2026-03-01T00:00:00.000Z', 'MONTH_YEAR', NOW)).toEqual({ unit: 'months', count: 8, year: 2026 });
  });
  it('does not count a year before the exact anniversary day', () => {
    expect(plantAge('2015-11-20T00:00:00.000Z', 'EXACT_DATE', NOW)).toEqual({ unit: 'years', count: 10, year: 2015 });
  });
  it('says this year for a year-only date in the current year', () => {
    expect(plantAge('2026-01-01T00:00:00.000Z', 'YEAR', NOW)).toEqual({ unit: 'years', count: 0, year: 2026 });
  });
  it('has no age without a planting date', () => {
    expect(plantAge(null, 'UNKNOWN', NOW)).toBeNull();
    expect(plantAge('2015-01-01T00:00:00.000Z', 'UNKNOWN', NOW)).toBeNull();
  });
});
