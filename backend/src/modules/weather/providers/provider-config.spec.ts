import { InvariantError } from '../../../common/errors';
import { buildProviders, parseProviderNames } from './provider-config';

const fetch = jest.fn() as unknown as typeof globalThis.fetch;

describe('parseProviderNames', () => {
  it('defaults to Open-Meteo when unset', () => {
    expect(parseProviderNames(undefined)).toEqual(['open-meteo']);
  });

  it('reads an ordered, comma-separated list', () => {
    expect(parseProviderNames(' open-meteo , open-meteo ')).toEqual([
      'open-meteo',
    ]);
  });

  it('turns weather off with "none"', () => {
    expect(parseProviderNames('none')).toEqual([]);
  });

  it('refuses an unknown provider (a typo must not silently drop weather)', () => {
    expect(() => parseProviderNames('open-meteo,acme')).toThrow(InvariantError);
  });

  it('refuses "none" mixed with providers', () => {
    expect(() => parseProviderNames('none,open-meteo')).toThrow(InvariantError);
  });
});

describe('buildProviders', () => {
  it('builds the listed providers in order', () => {
    const providers = buildProviders(
      { WEATHER_PROVIDERS: 'open-meteo' },
      fetch,
    );
    expect(providers.map((p) => p.name)).toEqual(['Open-Meteo']);
  });

  it('builds nothing when weather is off', () => {
    expect(buildProviders({ WEATHER_PROVIDERS: 'none' }, fetch)).toEqual([]);
  });
});
