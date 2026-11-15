import { monthName, monthRange, monthYear } from './month-label';

describe('month labels in the request language', () => {
  it('keeps the English labels exactly', () => {
    expect(monthRange(10, 11, 'en')).toBe('Oct–Nov');
    expect(monthRange(1, 12, 'en')).toBe('Jan–Dec');
    expect(monthName(3, 'en')).toBe('Mar');
    expect(monthYear(new Date('2026-09-30T20:00:00Z'), 'en')).toBe('Oct 2026');
  });

  it('writes Hindi month names in full', () => {
    expect(monthRange(10, 11, 'hi')).toBe('अक्टूबर–नवंबर');
    expect(monthYear(new Date('2026-09-30T20:00:00Z'), 'hi')).toBe(
      'अक्टूबर 2026',
    );
  });
});
