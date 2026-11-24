import { RegionCluster } from '@prisma/client';
import { SEASON_GUIDE_SEED } from './season-guide.seed';

const R = RegionCluster;
const months = (region: RegionCluster) =>
  SEASON_GUIDE_SEED.find((g) => g.region === region)!.months;

/** Spot checks of the text moved word for word from code (stage 4). */
describe('season guide seed', () => {
  it('has a season, a headline and two or three points for every region and month', () => {
    for (const region of Object.values(R)) {
      expect(months(region)).toHaveLength(12);
      for (const month of months(region)) {
        expect(month.season).not.toBe('');
        expect(month.headline.length).toBeGreaterThan(10);
        expect(month.points.length).toBeGreaterThanOrEqual(2);
        expect(month.points.length).toBeLessThanOrEqual(3);
      }
    }
  });

  it.each([
    [R.EAST_INDIA, 10, 'Post-monsoon'],
    [R.NORTH_INDIA, 0, 'Winter'],
    [R.SOUTH_DECCAN, 10, 'Northeast monsoon'],
    [R.SOUTH_DECCAN, 6, 'Southwest monsoon'],
    [R.COASTAL_HUMID, 6, 'Southwest monsoon'],
    [R.HILLS_COOL, 0, 'Winter'],
    [R.HILLS_COOL, 3, 'Spring'],
  ])('%s month %i is %s', (region, month, season) => {
    expect(months(region)[month].season).toBe(season);
  });

  it('keeps the text it had in code', () => {
    expect(months(R.NORTH_INDIA)[0].headline).toBe(
      'Cold nights: protect young plants and keep winter vegetables growing.',
    );
    expect(months(R.NORTH_INDIA)[2].points[0]).toBe(
      "Don't over-water mango in flower; watch for hoppers and powdery mildew.",
    );
  });

  it('never warns about frost where there is none', () => {
    for (const region of [R.SOUTH_DECCAN, R.COASTAL_HUMID])
      for (const m of months(region))
        expect(`${m.headline} ${m.points.join(' ')}`).not.toMatch(
          /frost|snow/i,
        );
  });

  it('never claims weather or temperatures', () => {
    for (const region of Object.values(R))
      for (const m of months(region))
        expect(`${m.headline} ${m.points.join(' ')}`).not.toMatch(
          /°|degrees|forecast/i,
        );
  });
});
