import { describe, expect, it } from 'vitest';
import { suggestDistricts, type DistrictOption } from './regions';

const d = (name: string, aliases: string[] = []): DistrictOption => ({ name, state: 'X', region: 'NORTH_INDIA', label: name, aliases });

describe('suggestDistricts: the district type-ahead', () => {
  const list = [d('Gurugram', ['Gurgaon']), d('North Goa'), d('South Goa'), d('Patna'), d('Purnia')];
  it('needs two letters; names that start with it come before a word inside', () => {
    expect(suggestDistricts('p', list)).toEqual([]);
    expect(suggestDistricts('go', list).map((x) => x.name)).toEqual(['North Goa', 'South Goa']);
    expect(suggestDistricts('pa', list).map((x) => x.name)).toEqual(['Patna']);
  });
  it('finds old names and caps the list', () => {
    expect(suggestDistricts('gurgaon', list).map((x) => x.name)).toEqual(['Gurugram']);
    expect(suggestDistricts('pu', list, 1)).toHaveLength(1);
  });
});
