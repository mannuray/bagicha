import { CATALOGUE_SEED } from '../seed';
import { validateSeed } from './schemas';
import type { SeasonGuideSeed } from './season-guide';

const month = {
  season: 'Winter',
  headline: 'Cold nights.',
  points: ['Water less.'],
};
const guide = (over: Partial<SeasonGuideSeed> = {}): SeasonGuideSeed => ({
  region: 'NORTH_INDIA',
  months: Array.from({ length: 12 }, () => month),
  status: 'APPROVED',
  notes: null,
  ...over,
});
const withGuides =
  (...seasonGuide: unknown[]) =>
  () =>
    validateSeed({ ...CATALOGUE_SEED, seasonGuide });
const others = () =>
  CATALOGUE_SEED.seasonGuide.filter((g) => g.region !== 'NORTH_INDIA');

describe('season guide records in the seed', () => {
  it('accepts the seed', () => {
    expect(() => validateSeed(CATALOGUE_SEED)).not.toThrow();
  });

  it('rejects 11 months', () => {
    expect(
      withGuides(...others(), guide({ months: Array(11).fill(month) })),
    ).toThrow();
  });

  it('rejects an unknown field', () => {
    expect(withGuides(...others(), { ...guide(), extra: 1 })).toThrow();
  });

  it('accepts Hindi on a month and rejects Hindi points of a different length', () => {
    const hiMonth = {
      ...month,
      hi: {
        season: 'सर्दी',
        headline: 'ठंडी रातें।',
        points: ['पानी कम दें।'],
      },
    };
    expect(
      withGuides(...others(), guide({ months: Array(12).fill(hiMonth) })),
    ).not.toThrow();
    const bad = { ...month, hi: { points: ['एक', 'दो'] } };
    expect(
      withGuides(...others(), guide({ months: Array(12).fill(bad) })),
    ).toThrow();
  });

  it('rejects a region listed twice', () => {
    expect(withGuides(...others(), guide(), guide())).toThrow();
  });

  it('reports a region with no approved guide', () => {
    expect(withGuides(...others())).toThrow();
    expect(withGuides(...others(), guide({ status: 'DRAFT' }))).toThrow();
  });
});

describe('Catalogue.seasonGuide', () => {
  it("gives a region's twelve months, January first, and lists every region", () => {
    const { Catalogue } = jest.requireActual('./catalogue');
    const catalogue = Catalogue.from(CATALOGUE_SEED, 1);
    expect(catalogue.seasonGuide('NORTH_INDIA')).toHaveLength(12);
    expect(catalogue.seasonGuide('NORTH_INDIA')[0].season).toBe('Winter');
    expect(catalogue.approvedCounts().seasonGuideRegions).toHaveLength(7);
  });
});
