import { describe, expect, it } from 'vitest';
import { monthYear, shortDate } from './format';

describe('date formats (always India time)', () => {
  it('month and year', () => {
    expect(monthYear('2026-11-30T20:00:00Z', 'en')).toBe('Dec 2026');
  });
  it('day and short month', () => {
    expect(shortDate('2026-03-10T00:00:00Z', 'en')).toBe('10 Mar');
  });
});
