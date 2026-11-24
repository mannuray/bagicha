import { SEASON_GUIDE } from '../../seasonal/domain/season-guide';
import { SEASON_GUIDE_SEED } from './season-guide.seed';

describe('season guide seed', () => {
  it('the seed equals the old SEASON_GUIDE for every region and month', () => {
    expect(
      Object.fromEntries(SEASON_GUIDE_SEED.map((g) => [g.region, g.months])),
    ).toEqual(SEASON_GUIDE);
  });
});
