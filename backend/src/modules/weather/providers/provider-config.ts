import { InvariantError } from '../../../common/errors';
import { OpenMeteoProvider } from './open-meteo.provider';
import type { Fetch, WeatherProvider } from './weather-provider';

type Env = Record<string, string | undefined>;

interface ProviderEntry {
  /** Env var the provider cannot run without (startup refuses when it is missing). */
  requiredKey?: string;
  build(env: Env, fetch: Fetch): WeatherProvider;
}

/**
 * Every weather source the app knows. Adding one is one adapter plus one line
 * here; WEATHER_PROVIDERS picks which run, and in what order.
 */
const REGISTRY: Record<string, ProviderEntry> = {
  'open-meteo': {
    build: (env, fetch) =>
      new OpenMeteoProvider(fetch, env.OPEN_METEO_API_KEY?.trim() || undefined),
  },
};

const DEFAULT = ['open-meteo'];

/** WEATHER_PROVIDERS: an ordered list ("open-meteo,openweathermap"); unset means Open-Meteo, "none" turns weather off. */
export function parseProviderNames(raw: string | undefined): string[] {
  if (raw === undefined || raw.trim() === '') return DEFAULT;
  const names = [
    ...new Set(
      raw
        .split(',')
        .map((n) => n.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
  if (names.length === 1 && names[0] === 'none') return [];
  const unknown = names.filter((n) => !(n in REGISTRY));
  if (unknown.length > 0) {
    throw new InvariantError('Unknown weather provider in WEATHER_PROVIDERS', {
      unknown,
      known: Object.keys(REGISTRY),
    });
  }
  return names;
}

/** Checks config at startup: every listed provider exists and has its key. */
export function validateWeatherEnv(env: Env): void {
  const missing = parseProviderNames(env.WEATHER_PROVIDERS)
    .map((n) => REGISTRY[n].requiredKey)
    .filter((key): key is string => !!key && !env[key]?.trim());
  if (missing.length > 0) {
    throw new InvariantError('A weather provider is missing its API key', {
      missing,
    });
  }
}

/** The configured providers, in fallback order. */
export function buildProviders(env: Env, fetch: Fetch): WeatherProvider[] {
  validateWeatherEnv(env);
  return parseProviderNames(env.WEATHER_PROVIDERS).map((n) =>
    REGISTRY[n].build(env, fetch),
  );
}
