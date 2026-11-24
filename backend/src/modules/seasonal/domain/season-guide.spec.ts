import { CATALOGUE_SEED } from '../../catalogue';
import { monthOf } from './season-guide';

const north = CATALOGUE_SEED.seasonGuide.find(
  (g) => g.region === 'EAST_INDIA',
)!.months;

describe('monthOf', () => {
  it('uses the month in India, not UTC', () => {
    // 31 Oct 20:00 UTC is already 1 Nov in India.
    const { hi: _hi, ...november } = north[10];
    expect(monthOf(north, new Date('2026-10-31T20:00:00Z'))).toEqual(november);
  });
});

describe('monthOf in Hindi', () => {
  const month = {
    season: 'Winter',
    headline: 'Cold nights.',
    points: ['Water less.', 'Mulch.'],
    hi: { season: 'सर्दी', points: ['पानी कम दें।', 'मल्च करें।'] },
  };
  const months = Array.from({ length: 12 }, () => month);
  const jan = new Date('2026-01-15T06:00:00+05:30');

  it('uses the Hindi it has and English for the rest', () => {
    expect(monthOf(months, jan, 'hi')).toEqual({
      season: 'सर्दी',
      headline: 'Cold nights.',
      points: ['पानी कम दें।', 'मल्च करें।'],
    });
  });

  it('English is unchanged', () => {
    expect(monthOf(months, jan, 'en')).toMatchObject({ season: 'Winter' });
  });
});
