import { CATALOGUE_SEED } from '../../catalogue';
import { monthOf } from './season-guide';

const north = CATALOGUE_SEED.seasonGuide.find(
  (g) => g.region === 'EAST_INDIA',
)!.months;

describe('monthOf', () => {
  it('uses the month in India, not UTC', () => {
    // 31 Oct 20:00 UTC is already 1 Nov in India.
    expect(monthOf(north, new Date('2026-10-31T20:00:00Z'))).toBe(north[10]);
  });
});
