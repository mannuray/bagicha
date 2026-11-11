import { describe, expect, it } from 'vitest';
import { istHour, monthName } from './format';

describe('India-time greetings and month names', () => {
  it('the hour is India\'s, whatever the device clock zone', () => {
    expect(istHour(new Date('2026-11-12T02:00:00Z'))).toBe(7);
    expect(istHour(new Date('2026-11-12T19:00:00Z'))).toBe(0);
  });
  it('the month flips at India\'s midnight', () => {
    expect(monthName(new Date('2026-11-30T19:00:00Z'), 'en')).toBe('December');
  });
});
