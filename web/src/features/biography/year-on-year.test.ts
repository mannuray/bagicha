import { describe, expect, it } from 'vitest';
import type { Cycle } from '../plants';
import { cycleRecord } from '../../test/fixtures';
import { compareRows, isFinished, yearOnYear } from './year-on-year';

const NOW = new Date('2026-11-10T06:00:00Z');
const cycle = (over: Record<string, unknown>) => cycleRecord(over) as unknown as Cycle;

describe('isFinished', () => {
  it('counts a past year or a harvested season as finished', () => {
    expect(isFinished(cycle({ cycle_year: 2025 }), NOW)).toBe(true);
    expect(isFinished(cycle({ cycle_year: 2026 }), NOW)).toBe(false);
    expect(isFinished(cycle({ cycle_year: 2026, harvest_started_at: '2026-06-01T00:00:00Z' }), NOW)).toBe(true);
  });
});

describe('yearOnYear', () => {
  const cycles = [
    cycle({ id: 'a', cycle_year: 2026 }),
    cycle({ id: 'b', cycle_year: 2025, yield_quantity: 40, yield_unit: 'kg' }),
    cycle({ id: 'c', cycle_year: 2024, yield_quantity: 3, yield_unit: 'crates' }),
    cycle({ id: 'd', cycle_year: 2023, yield_quantity: 30, yield_unit: 'kg' }),
  ];

  it('bars only the latest unit, marks the unfinished year, newest first', () => {
    const y = yearOnYear(cycles, NOW);
    expect(y.unit).toBe('kg');
    expect(y.years.map((r) => [r.year, r.barred, r.soFar])).toEqual([
      [2026, false, true],
      [2025, true, false],
      [2024, false, false],
      [2023, true, false],
    ]);
  });

  it('compares the two most recent finished seasons', () => {
    const y = yearOnYear(cycles, NOW);
    expect(y.latest?.id).toBe('b');
    expect(y.previous?.id).toBe('c');
  });

  it('has nothing to compare without finished seasons', () => {
    const y = yearOnYear([cycle({ cycle_year: 2026 })], NOW);
    expect(y.latest).toBeNull();
    expect(y.previous).toBeNull();
    expect(y.unit).toBeNull();
  });
});

describe('compareRows', () => {
  const row = (rows: ReturnType<typeof compareRows>, key: string) => rows.find((r) => r.key === key);

  it('marks lower drop as better and unknown drop as not logged', () => {
    const rows = compareRows(
      cycle({ flower_drop_level: 'LOW', fruit_drop_level: 'UNKNOWN' }),
      cycle({ flower_drop_level: 'HIGH', fruit_drop_level: 'HIGH' }),
    );
    expect(row(rows, 'flowerDrop')).toMatchObject({ now: 'LOW', before: 'HIGH', trend: 'better' });
    expect(row(rows, 'fruitDrop')).toMatchObject({ now: '—', before: 'HIGH', trend: null });
  });

  it('compares yield only in the same unit', () => {
    const same = compareRows(cycle({ yield_quantity: 40, yield_unit: 'kg' }), cycle({ yield_quantity: 30, yield_unit: 'kg' }));
    expect(row(same, 'yield')).toMatchObject({ now: '40 kg', before: '30 kg', trend: 'better' });
    const mixed = compareRows(cycle({ yield_quantity: 40, yield_unit: 'kg' }), cycle({ yield_quantity: 3, yield_unit: 'crates' }));
    expect(row(mixed, 'yield')).toMatchObject({ now: '40 kg', before: '3 crates', trend: null });
  });

  it('counts fewer pest reports as better', () => {
    const rows = compareRows(cycle({ pest_pressure_score: 0 }), cycle({ pest_pressure_score: 2 }));
    expect(row(rows, 'pests')).toMatchObject({ now: '0', before: '2', trend: 'better' });
  });

  it('shows dashes and no trends without a previous season', () => {
    const rows = compareRows(cycle({ yield_quantity: 40, yield_unit: 'kg' }), null);
    expect(row(rows, 'yield')).toMatchObject({ now: '40 kg', before: '—', trend: null });
  });
});
