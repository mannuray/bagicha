import { RegionCluster } from '@prisma/client';
import { seasonGuide, SEASON_GUIDE } from './season-guide';

const R = RegionCluster;
const at = (iso: string) => new Date(`${iso}T06:00:00Z`);

describe('season guide', () => {
  it('has a season, a headline and two or three points for every region and month', () => {
    for (const region of Object.values(R)) {
      expect(SEASON_GUIDE[region]).toHaveLength(12);
      for (const month of SEASON_GUIDE[region]) {
        expect(month.season).not.toBe('');
        expect(month.headline.length).toBeGreaterThan(10);
        expect(month.points.length).toBeGreaterThanOrEqual(2);
        expect(month.points.length).toBeLessThanOrEqual(3);
      }
    }
  });

  it.each([
    [R.EAST_INDIA, '2026-11-10', 'Post-monsoon'],
    [R.NORTH_INDIA, '2026-01-15', 'Winter'],
    [R.SOUTH_DECCAN, '2026-11-10', 'Northeast monsoon'],
    [R.SOUTH_DECCAN, '2026-07-10', 'Southwest monsoon'],
    [R.COASTAL_HUMID, '2026-07-10', 'Southwest monsoon'],
    [R.HILLS_COOL, '2026-01-15', 'Winter'],
    [R.HILLS_COOL, '2026-04-15', 'Spring'],
  ])('%s on %s is %s', (region, date, season) => {
    expect(seasonGuide(region, at(date)).season).toBe(season);
  });

  it('uses the month in India, not UTC', () => {
    // 31 Oct 20:00 UTC is already 1 Nov in India.
    expect(seasonGuide(R.EAST_INDIA, new Date('2026-10-31T20:00:00Z'))).toEqual(
      SEASON_GUIDE[R.EAST_INDIA][10],
    );
  });

  it('never warns about frost where there is none', () => {
    for (const region of [R.SOUTH_DECCAN, R.COASTAL_HUMID]) {
      for (const m of SEASON_GUIDE[region]) {
        expect(`${m.headline} ${m.points.join(' ')}`).not.toMatch(
          /frost|snow/i,
        );
      }
    }
  });

  it('never claims weather or temperatures', () => {
    for (const region of Object.values(R)) {
      for (const m of SEASON_GUIDE[region])
        expect(`${m.headline} ${m.points.join(' ')}`).not.toMatch(
          /°|degrees|forecast/i,
        );
    }
  });
});
