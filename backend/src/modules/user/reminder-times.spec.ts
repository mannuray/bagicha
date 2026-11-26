import {
  allowedMinutes,
  countWindow,
  istQuarter,
  REMINDER_RANGES,
} from './reminder-times';

describe('reminder times', () => {
  it('allows the morning from 06:00 to 11:45 in 15-minute steps', () => {
    const morning = allowedMinutes('MORNING');
    expect(morning).toHaveLength(24);
    expect(morning[0]).toBe(360);
    expect(morning.at(-1)).toBe(705);
    expect(morning).toContain(REMINDER_RANGES.MORNING.default);
  });

  it('allows the evening from 15:00 to 21:45', () => {
    const evening = allowedMinutes('EVENING');
    expect(evening[0]).toBe(900);
    expect(evening.at(-1)).toBe(1305);
    expect(evening).toContain(1080);
  });

  it('reads the IST date and quarter-hour, not the UTC ones', () => {
    // 00:30Z is 06:00 IST on the same calendar day.
    expect(istQuarter(new Date('2026-11-27T00:30:00Z'))).toEqual({
      istDate: '2026-11-27',
      minute: 360,
    });
    expect(istQuarter(new Date('2026-11-27T01:59:59Z'))).toEqual({
      istDate: '2026-11-27',
      minute: 435,
    });
    // 18:30Z is midnight IST: the next day starts.
    expect(istQuarter(new Date('2026-11-26T18:29:00Z'))).toEqual({
      istDate: '2026-11-26',
      minute: 1425,
    });
    expect(istQuarter(new Date('2026-11-26T18:30:00Z'))).toEqual({
      istDate: '2026-11-27',
      minute: 0,
    });
  });

  it('counts a week back and knows tomorrow, across month ends', () => {
    expect(countWindow('2026-12-03')).toEqual({
      fromDate: '2026-11-26',
      toDate: '2026-12-03',
      tomorrow: '2026-12-04',
    });
    expect(countWindow('2026-12-31').tomorrow).toBe('2027-01-01');
  });
});
