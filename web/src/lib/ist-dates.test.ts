import { describe, expect, it } from 'vitest';
import { istDateString, istNoonIso } from './ist';

describe('IST date helpers', () => {
  it('a picked day is pinned to its noon in India', () => {
    expect(istNoonIso('2026-03-10')).toBe('2026-03-10T06:30:00.000Z');
  });

  it('today as YYYY-MM-DD in India, even when UTC is still on yesterday', () => {
    expect(istDateString(new Date('2026-11-11T20:00:00Z'))).toBe('2026-11-12');
    expect(istDateString(new Date('2026-01-05T06:00:00Z'))).toBe('2026-01-05');
  });
});
