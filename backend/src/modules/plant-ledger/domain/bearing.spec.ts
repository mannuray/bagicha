import { lifeProfileFor } from './species-life-profiles';
import { firstsToClear, predatesFirsts, resolveBearing } from './bearing';

const NOW = new Date('2026-11-11T06:00:00Z');
const mango = lifeProfileFor('mango');
const planted = (year: number) => new Date(`${year}-06-01T00:00:00Z`);

describe('predatesFirsts: the tree fruited before we knew it', () => {
  it('is true when the gardener says it already fruits', () => {
    expect(
      predatesFirsts(
        {
          bearing_status: 'BEARING',
          planting_date: planted(2025),
          profile: mango,
        },
        NOW,
      ),
    ).toBe(true);
  });

  it('is false when the gardener says not yet, whatever its age', () => {
    expect(
      predatesFirsts(
        {
          bearing_status: 'NOT_YET',
          planting_date: planted(2010),
          profile: mango,
        },
        NOW,
      ),
    ).toBe(false);
  });

  it('when unsure, is true only past the latest usual first-fruit age', () => {
    expect(
      predatesFirsts(
        { bearing_status: null, planting_date: planted(2017), profile: mango },
        NOW,
      ),
    ).toBe(true);
    expect(
      predatesFirsts(
        { bearing_status: null, planting_date: planted(2025), profile: mango },
        NOW,
      ),
    ).toBe(false);
  });

  it('is false without a planting date or a life profile', () => {
    expect(
      predatesFirsts(
        { bearing_status: null, planting_date: null, profile: mango },
        NOW,
      ),
    ).toBe(false);
    expect(
      predatesFirsts(
        { bearing_status: null, planting_date: planted(2000), profile: null },
        NOW,
      ),
    ).toBe(false);
  });
});

describe('the planted year alone counts from the end of that year', () => {
  const banana = lifeProfileFor('banana');
  it('a banana planted "2025" is not past its first fruit in Nov 2026', () => {
    expect(
      predatesFirsts(
        {
          bearing_status: null,
          planting_date: new Date('2025-01-01T00:00:00Z'),
          planting_date_precision: 'YEAR',
          profile: banana,
        },
        NOW,
      ),
    ).toBe(false);
  });
});

describe('firstsToClear', () => {
  const plant = {
    first_flowering_at: new Date('2024-03-01'),
    first_fruit_set_at: null,
    first_harvest_at: new Date('2026-06-01'),
  };
  it('clears only firsts recorded after the since-year', () => {
    expect(firstsToClear(plant, 2025)).toEqual({ first_harvest_at: null });
  });
  it('clears nothing without a year: firsts logged in Bagicha may be real', () => {
    expect(firstsToClear(plant, null)).toEqual({});
  });
});

describe('resolveBearing', () => {
  const ctx = {
    record_kind: 'TREE',
    planting_date: new Date('2017-01-01'),
    now: NOW,
  };
  it('drops the answer for anything but a tree', () => {
    expect(
      resolveBearing(
        { bearing_status: 'BEARING', bearing_since_year: 2019 },
        { ...ctx, record_kind: 'FLOWER' },
      ),
    ).toEqual({ bearing_status: null, bearing_since_year: null });
  });
  it('drops a year sent with "not yet"', () => {
    expect(
      resolveBearing(
        { bearing_status: 'NOT_YET', bearing_since_year: 2019 },
        ctx,
      ),
    ).toEqual({ bearing_status: 'NOT_YET', bearing_since_year: null });
  });
  it('refuses a year before planting when the gardener sends it', () => {
    expect(() =>
      resolveBearing(
        { bearing_status: 'BEARING', bearing_since_year: 2015 },
        ctx,
      ),
    ).toThrow();
  });
  it('quietly drops a stored year the corrected planting date makes impossible', () => {
    expect(
      resolveBearing(
        { bearing_status: 'BEARING', bearing_since_year: 2015 },
        { ...ctx, yearIsStored: true },
      ),
    ).toEqual({ bearing_status: 'BEARING', bearing_since_year: null });
  });
});
