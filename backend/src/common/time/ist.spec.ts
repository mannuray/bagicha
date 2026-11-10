import { FixedClock, SystemClock } from './clock';
import { addDays, istMonth, istYear } from './ist';

describe('IST helpers', () => {
  it('rolls into November at IST midnight, before UTC does', () => {
    expect(istMonth(new Date('2026-10-31T19:00:00Z'))).toBe(11);
  });

  it('is still October half an hour before IST midnight', () => {
    expect(istMonth(new Date('2026-10-31T18:00:00Z'))).toBe(10);
  });

  it('rolls the year at IST midnight on 1 January', () => {
    expect(istYear(new Date('2026-12-31T19:00:00Z'))).toBe(2027);
    expect(istYear(new Date('2026-12-31T18:00:00Z'))).toBe(2026);
  });

  it('adds whole days without mutating the input', () => {
    const start = new Date('2026-03-01T00:00:00Z');
    expect(addDays(start, 5).toISOString()).toBe('2026-03-06T00:00:00.000Z');
    expect(start.toISOString()).toBe('2026-03-01T00:00:00.000Z');
  });
});

describe('Clock', () => {
  it('FixedClock always returns a copy of the same instant', () => {
    const clock = new FixedClock(new Date('2026-05-05T05:05:05Z'));
    const a = clock.now();
    a.setFullYear(1999);
    expect(clock.now().toISOString()).toBe('2026-05-05T05:05:05.000Z');
  });

  it('SystemClock reads the real time', () => {
    const before = Date.now();
    const now = new SystemClock().now().getTime();
    expect(now).toBeGreaterThanOrEqual(before);
  });
});
