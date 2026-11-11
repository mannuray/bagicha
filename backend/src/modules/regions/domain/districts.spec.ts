import { RegionCluster } from '@prisma/client';
import { DISTRICTS } from './districts';
import {
  districtLabel,
  matchDistrict,
  regionForDistrict,
} from './district-match';

const R = RegionCluster;
const STATES = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];
const SHARED = [
  'Aurangabad',
  'Bilaspur',
  'Hamirpur',
  'Pratapgarh',
  'Balrampur',
  'Bijapur',
  'Raigarh',
];

describe('the district list', () => {
  it('covers all 36 states and union territories, with about 780 districts', () => {
    expect([...new Set(DISTRICTS.map((d) => d.state))].sort()).toEqual(
      [...STATES].sort(),
    );
    expect(DISTRICTS.length).toBeGreaterThanOrEqual(770);
  });

  it('gives every district a region, with no duplicate name in one state', () => {
    const seen = new Set<string>();
    for (const d of DISTRICTS) {
      expect(Object.values(R)).toContain(d.region);
      const key = `${d.name}|${d.state}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it('never reuses an alias across districts, except the seven shared names', () => {
    const owner = new Map<string, string>();
    for (const d of DISTRICTS) {
      for (const form of [d.name, ...d.aliases]) {
        const k = form.toLowerCase();
        if (
          owner.has(k) &&
          owner.get(k) !== d.state &&
          !SHARED.includes(form) &&
          !d.needsState
        ) {
          throw new Error(
            `"${form}" is used by ${owner.get(k)} and ${d.state}`,
          );
        }
        owner.set(k, d.state);
      }
    }
  });

  it('records the parent of each district created after 2021', () => {
    const parents = DISTRICTS.filter((d) => d.parent);
    expect(parents.length).toBeGreaterThanOrEqual(40);
    for (const d of parents)
      expect(
        DISTRICTS.some((p) => p.name === d.parent && p.state === d.state),
      ).toBe(true);
  });
});

describe('regions by district', () => {
  it.each([
    ['Gaya', R.EAST_INDIA],
    ['Varanasi', R.EAST_INDIA],
    ['Gorakhpur', R.EAST_INDIA],
    ['Meerut', R.NORTH_INDIA],
    ['Lucknow', R.NORTH_INDIA],
    ['Nagpur', R.CENTRAL_INDIA],
    ['Indore', R.CENTRAL_INDIA],
    ['Udupi', R.COASTAL_HUMID],
    ['Ratnagiri', R.COASTAL_HUMID],
    ['Ernakulam', R.COASTAL_HUMID],
    ['Darjeeling', R.HILLS_COOL],
    ['Mumbai', R.WEST_INDIA],
    ['Pune', R.WEST_INDIA],
    ['Chennai', R.SOUTH_DECCAN],
    ['Hyderabad', R.SOUTH_DECCAN],
    ['Hydrabad', R.SOUTH_DECCAN],
    ['Dehradun', R.HILLS_COOL],
    ['Haridwar', R.NORTH_INDIA],
    ['Rajouri', R.HILLS_COOL],
    ['Jammu', R.NORTH_INDIA],
    ['Srinagar', R.HILLS_COOL],
    ['Leh', R.HILLS_COOL],
    ['Guwahati', R.EAST_INDIA],
    ['Shillong', R.HILLS_COOL],
    ['Gangtok', R.HILLS_COOL],
    ['Shimla', R.HILLS_COOL],
    ['Jaipur', R.WEST_INDIA],
    ['Raipur', R.CENTRAL_INDIA],
  ])('%s is %s', (district, region) => {
    expect(regionForDistrict(district)).toBe(region);
  });
});

describe('matching what people type', () => {
  it('knows old and common names', () => {
    expect(matchDistrict('gurgaon')?.name).toBe('Gurugram');
    expect(matchDistrict('Allahabad')?.name).toBe('Prayagraj');
    expect(matchDistrict('Prayagraj')?.name).toBe('Prayagraj');
    expect(matchDistrict('Bangalore')?.name).toBe('Bengaluru Urban');
    expect(matchDistrict('Calcutta')?.name).toBe('Kolkata');
  });

  it('reads "Name, State" and "Name State", and a city suffix', () => {
    expect(matchDistrict('Gaya, Bihar')?.name).toBe('Gaya');
    expect(matchDistrict('Patna city')?.name).toBe('Patna');
  });

  it('tells shared names apart only by state', () => {
    expect(matchDistrict('Aurangabad, Bihar')).toMatchObject({
      state: 'Bihar',
      region: R.EAST_INDIA,
    });
    expect(matchDistrict('Aurangabad, Maharashtra')).toMatchObject({
      state: 'Maharashtra',
      region: R.WEST_INDIA,
    });
    expect(matchDistrict('Aurangabad')).toBeNull();
    expect(districtLabel(matchDistrict('Bilaspur, Himachal Pradesh')!)).toBe(
      'Bilaspur, Himachal Pradesh',
    );
    expect(districtLabel(matchDistrict('Gaya')!)).toBe('Gaya');
  });

  it('never matches a name hidden inside another word', () => {
    expect(matchDistrict('Jagarnathpur')).toBeNull();
  });

  it('matches Delhi and Sikkim direction names only with their state', () => {
    expect(matchDistrict('East')).toBeNull();
    expect(matchDistrict('East, Delhi')).toMatchObject({
      name: 'East',
      state: 'Delhi',
    });
    expect(matchDistrict('East Godavari')?.state).toBe('Andhra Pradesh');
  });

  it('returns null for text that names no district', () => {
    expect(matchDistrict('')).toBeNull();
    expect(matchDistrict('my garden')).toBeNull();
  });

  it('places plains towns by where they really are', () => {
    // Siliguri spans Darjeeling (hills district) and Jalpaiguri but is plains: no guess, the gardener picks.
    expect(matchDistrict('Siliguri')).toBeNull();
    expect(matchDistrict('Haldwani')).toBeNull();
    expect(matchDistrict('Navi Mumbai')).toMatchObject({
      name: 'Thane',
      region: R.COASTAL_HUMID,
    });
  });
});
