import { DistrictLocator } from '../../regions';
import { weatherPlace } from './weather-place';

const locator = new DistrictLocator();
const user = (u: {
  latitude?: number | null;
  longitude?: number | null;
  district?: string | null;
}) => ({
  latitude: null,
  longitude: null,
  district: null,
  ...u,
});

describe('weatherPlace', () => {
  it("uses the user's saved point first, snapped to its grid cell", () => {
    const place = weatherPlace(
      user({ latitude: 25.6123, longitude: 85.1376, district: 'Gaya' }),
      locator,
    );
    expect(place?.key).toBe('25.6,85.1');
  });

  it('falls back to the centre of the district', () => {
    const place = weatherPlace(user({ district: 'Patna' }), locator);
    const located = locator.locate(place!.lat, place!.lng);
    expect(located?.district).toBe('Patna');
  });

  it('uses the state saved with a shared name', () => {
    const place = weatherPlace(
      user({ district: 'Bilaspur, Chhattisgarh' }),
      locator,
    );
    expect(locator.locate(place!.lat, place!.lng)?.state).toBe('Chhattisgarh');
  });

  it('gives no weather for a bare name shared by two states, rather than guess', () => {
    expect(weatherPlace(user({ district: 'Bilaspur' }), locator)).toBeNull();
  });

  it('gives no weather with neither a point nor a district', () => {
    expect(weatherPlace(user({}), locator)).toBeNull();
    expect(weatherPlace(user({ district: 'Atlantis' }), locator)).toBeNull();
  });

  it('ignores a half-saved point', () => {
    const place = weatherPlace(
      user({ latitude: 25.6, district: 'Gaya' }),
      locator,
    );
    expect(locator.locate(place!.lat, place!.lng)?.district).toBe('Gaya');
  });
});
