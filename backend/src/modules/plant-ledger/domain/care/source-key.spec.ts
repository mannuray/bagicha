import { parseCareKey } from './source-key';

describe('parseCareKey', () => {
  it('reads a planting-timed key', () => {
    expect(parseCareKey('papaya:feed_1:d90')).toEqual({
      family: 'papaya',
      key: 'feed_1',
      start: { days: 90 },
    });
  });

  it('reads a citrus kind and a calendar date', () => {
    expect(parseCareKey('citrus:lime:canker_spray:2026-10-01')).toEqual({
      family: 'citrus:lime',
      key: 'canker_spray',
      start: { month: 10, day: 1 },
    });
  });

  it('refuses keys that are not tree care', () => {
    expect(parseCareKey('pack1:seasonal_primary_action')).toBeNull();
    expect(parseCareKey('lifecycle:p1:SAPLING:WATER')).toBeNull();
    expect(parseCareKey('')).toBeNull();
  });
});
