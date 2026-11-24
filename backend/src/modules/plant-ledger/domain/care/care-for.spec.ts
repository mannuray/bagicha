import { Catalogue, CATALOGUE_SEED } from '../../../catalogue';
import { careFor } from './care-for';

const catalogue = Catalogue.from(CATALOGUE_SEED, 1);

describe('careFor', () => {
  it('gives reviewed care where it applies', () => {
    expect(
      careFor(
        catalogue,
        'pomegranate',
        { species: 'pomegranate' },
        'NORTH_INDIA',
      )?.family,
    ).toBe('pomegranate');
  });

  it('gives nothing in a region still pending', () => {
    expect(
      careFor(
        catalogue,
        'pomegranate',
        { species: 'pomegranate' },
        'WEST_INDIA',
      ),
    ).toBeNull();
  });

  it('gives nothing for a family without reviewed care', () => {
    expect(
      careFor(catalogue, 'jamun', { species: 'jamun' }, 'NORTH_INDIA'),
    ).toBeNull();
  });
});
