import { describe, expect, it } from 'vitest';
import { cropStatusLine } from './journey-header';

describe('cropStatusLine', () => {
  it('counts IST calendar days, so a crop sown last night is on day 1 this morning', () => {
    // Sown 10 Nov 21:00 IST; checked 11 Nov 08:00 IST (11 hours later).
    const line = cropStatusLine('IN_GROUND', '2026-11-10T15:30:00Z', 'Bag 1', new Date('2026-11-11T02:30:00Z'));
    expect(line).toEqual({ stage: 'IN_GROUND', day: 1, place: 'Bag 1' });
  });

  it('is day 0 on the day of sowing', () => {
    expect(cropStatusLine('NURSERY', '2026-11-11T01:00:00Z', 'Bag 1', new Date('2026-11-11T15:00:00Z'))).toEqual({ stage: 'NURSERY', day: 0, place: null });
  });
});
