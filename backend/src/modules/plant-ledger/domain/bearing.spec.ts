import { lifeProfileFor } from './species-life-profiles';
import { predatesFirsts } from './bearing';

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
