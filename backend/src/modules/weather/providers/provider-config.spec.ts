import { InvariantError } from '../../../common/errors';
import {
  buildProviders,
  parseProviderNames,
  readWeatherEnv,
} from './provider-config';

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

  it('builds OpenWeatherMap as a fallback after Open-Meteo', () => {
    const providers = buildProviders(
      {
        WEATHER_PROVIDERS: 'open-meteo,openweathermap',
        OPENWEATHERMAP_API_KEY: 'key-1',
      },
      fetch,
    );
    expect(providers.map((p) => p.name)).toEqual(['Open-Meteo', 'OpenWeather']);
  });

  it('refuses OpenWeatherMap without its key (startup fails loudly, not silently)', () => {
    expect(() =>
      buildProviders({ WEATHER_PROVIDERS: 'openweathermap' }, fetch),
    ).toThrow('A weather provider is missing its API key');
  });

  it('builds nothing when weather is off', () => {
    expect(buildProviders({ WEATHER_PROVIDERS: 'none' }, fetch)).toEqual([]);
  });
});

describe('readWeatherEnv', () => {
  it('reads every setting the providers need, so a configured OpenWeatherMap starts', () => {
    const settings: Record<string, string> = {
      WEATHER_PROVIDERS: 'openweathermap,open-meteo',
      OPENWEATHERMAP_API_KEY: 'owm-test-key',
      UNRELATED: 'x',
    };
    const env = readWeatherEnv((key) => settings[key]);
    expect(env).toEqual({
      WEATHER_PROVIDERS: 'openweathermap,open-meteo',
      OPEN_METEO_API_KEY: undefined,
      OPENWEATHERMAP_API_KEY: 'owm-test-key',
    });
    expect(buildProviders(env, fetch).map((p) => p.name)).toEqual([
      'OpenWeather',
      'Open-Meteo',
    ]);
  });
});
