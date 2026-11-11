import { describe, expect, it } from 'vitest';
import { bloomYears } from './bloom-years';

const e = (type: string, timestamp: string) => ({ type, timestamp });

describe('bloomYears: a flower\'s blooms per year', () => {
  it('counts blooms per India year, newest year first, with the first bloom of each', () => {
    const rows = bloomYears([
      e('FLOWERING', '2026-03-10T05:00:00Z'),
      e('BLOOM_PEAK', '2026-02-01T05:00:00Z'),
      e('FLOWERING', '2025-04-02T05:00:00Z'),
      e('NOTE', '2026-01-01T05:00:00Z'),
    ]);
    expect(rows).toEqual([
      { year: 2026, count: 2, first: '2026-02-01T05:00:00Z' },
      { year: 2025, count: 1, first: '2025-04-02T05:00:00Z' },
    ]);
  });

  it('a bloom late on 31 Dec UTC that is 1 Jan in India counts for the new year', () => {
    expect(bloomYears([e('FLOWERING', '2025-12-31T20:00:00Z')])).toEqual([{ year: 2026, count: 1, first: '2025-12-31T20:00:00Z' }]);
  });

  it('nothing logged, nothing shown', () => {
    expect(bloomYears([])).toEqual([]);
  });
});
