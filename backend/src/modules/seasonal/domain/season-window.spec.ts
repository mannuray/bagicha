import { RegionCluster, SeasonWindow } from '@prisma/client';
import { regionFor, resolveRegionCluster } from './region-cluster';
import { resolveSeasonWindow } from './season-window';

describe('resolveSeasonWindow (IST)', () => {
  it('enters monsoon at IST midnight on 1 July', () => {
    expect(resolveSeasonWindow(new Date('2026-06-30T19:00:00Z'))).toBe(
      SeasonWindow.MONSOON,
    );
  });

  it('is still summer half an hour before', () => {
    expect(resolveSeasonWindow(new Date('2026-06-30T18:00:00Z'))).toBe(
      SeasonWindow.SUMMER,
    );
  });

  it.each([
    ['2026-01-15T00:00:00Z', SeasonWindow.LATE_WINTER],
    ['2026-03-15T00:00:00Z', SeasonWindow.SPRING],
    ['2026-05-15T00:00:00Z', SeasonWindow.SUMMER],
    ['2026-08-15T00:00:00Z', SeasonWindow.MONSOON],
    ['2026-11-15T00:00:00Z', SeasonWindow.POST_MONSOON],
  ])('%s → %s', (iso, window) => {
    expect(resolveSeasonWindow(new Date(iso))).toBe(window);
  });
});

describe('resolveRegionCluster', () => {
  it.each([
    ['Patna', RegionCluster.EAST_INDIA],
    ['Lucknow', RegionCluster.NORTH_INDIA],
    ['Pune', RegionCluster.WEST_INDIA],
    ['Indore', RegionCluster.CENTRAL_INDIA],
    ['Bengaluru', RegionCluster.SOUTH_DECCAN],
    ['North Goa', RegionCluster.COASTAL_HUMID],
    ['Shimla', RegionCluster.HILLS_COOL],
    [null, RegionCluster.NORTH_INDIA],
    // The full district list (district-map spec): no longer only 21 cities.
    ['Gaya', RegionCluster.EAST_INDIA],
    ['Varanasi', RegionCluster.EAST_INDIA],
    ['Nagpur', RegionCluster.CENTRAL_INDIA],
    ['Udupi', RegionCluster.COASTAL_HUMID],
    ['Gurgaon', RegionCluster.NORTH_INDIA],
    // A bare shared name is unknown, not guessed: the North fallback applies.
    ['Aurangabad', RegionCluster.NORTH_INDIA],
    ['Aurangabad, Bihar', RegionCluster.EAST_INDIA],
  ])('%s → %s', (district, cluster) => {
    expect(resolveRegionCluster(district)).toBe(cluster);
  });
});

describe('regionFor', () => {
  it('prefers the region the user chose', () => {
    expect(
      regionFor({
        region_cluster: RegionCluster.HILLS_COOL,
        district: 'Patna',
      }),
    ).toBe(RegionCluster.HILLS_COOL);
  });

  it('falls back to matching the district when no region is stored', () => {
    expect(regionFor({ region_cluster: null, district: 'Patna' })).toBe(
      RegionCluster.EAST_INDIA,
    );
  });

  it('keeps a stored region for an old profile with a bare shared name', () => {
    expect(
      regionFor({
        region_cluster: RegionCluster.WEST_INDIA,
        district: 'Aurangabad',
      }),
    ).toBe(RegionCluster.WEST_INDIA);
  });
});
