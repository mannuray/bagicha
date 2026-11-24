import { resolveCycleYear } from './cycle-year';
import { seededCatalogue } from '../../catalogue/testing';

describe('resolveCycleYear (IST)', () => {
  it('starts the mango cycle at IST midnight on 1 November', () => {
    expect(resolveCycleYear(11, new Date('2026-10-31T19:00:00Z'))).toBe(2026);
  });

  it('keeps late-October IST events in the previous mango cycle', () => {
    expect(resolveCycleYear(11, new Date('2026-10-31T18:00:00Z'))).toBe(2025);
  });

  it('starts the citrus cycle in July (IST)', () => {
    expect(resolveCycleYear(7, new Date('2026-06-30T19:00:00Z'))).toBe(2026);
    expect(resolveCycleYear(7, new Date('2026-06-30T18:00:00Z'))).toBe(2025);
  });

  it('a January start is the calendar year', () => {
    expect(resolveCycleYear(1, new Date('2026-03-01T00:00:00Z'))).toBe(2026);
  });
});

describe('cycle start month from the catalogue', () => {
  it.each([
    ['mango', 11],
    ['litchi', 11],
    ['citrus', 7],
    ['guava', 6],
    ['pomegranate', 6],
    ['banana', 1],
    ['anything-else', 1],
    ['papaya', 1],
    [null, 1],
  ])('%s cycles start in month %i', (family, month) => {
    expect(seededCatalogue().cycleStartMonth(family)).toBe(month);
  });
});
