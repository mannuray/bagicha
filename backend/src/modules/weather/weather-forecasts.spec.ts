import { UpstreamError } from '../../common/errors';
import type { PinoLogger } from 'nestjs-pino';
import type { RedisService } from '../../common/redis/redis.service';
import type { Forecast } from './domain/forecast';
import { gridCell } from './domain/grid-cell';
import type { WeatherProvider } from './providers/weather-provider';
import { WeatherForecasts } from './weather-forecasts';

const forecast: Forecast = {
  now: { tempC: 27, condition: 'CLEAR' },
  days: [
    {
      date: '2026-11-25',
      condition: 'CLEAR',
      maxC: 28,
      minC: 14,
      rainMm: 0,
      rainChance: 0,
    },
  ],
};
const cell = gridCell(25.61, 85.13);

function provider(
  name: string,
  impl: WeatherProvider['forecast'],
): WeatherProvider & { forecast: jest.Mock } {
  return { name, forecast: jest.fn(impl) };
}
const ok = (name: string) => provider(name, () => Promise.resolve(forecast));
const failing = (name: string) =>
  provider(name, () => Promise.reject(new Error('down')));

function redis(stored: string | null = null, broken = false) {
  return {
    get: jest.fn(() =>
      broken
        ? Promise.reject(new Error('redis down'))
        : Promise.resolve(stored),
    ),
    set: jest.fn(() =>
      broken ? Promise.reject(new Error('redis down')) : Promise.resolve(),
    ),
  };
}
/** Redis while unreachable: the client queues commands and they never settle. */
function hangingRedis() {
  const never = () => new Promise<string | null>(() => undefined);
  return { get: jest.fn(never), set: jest.fn(never) };
}
const logger = () => ({ warn: jest.fn(), info: jest.fn() });

function build(
  providers: WeatherProvider[],
  r: { get: jest.Mock; set: jest.Mock } = redis(),
  timeoutMs = 50,
) {
  const log = logger();
  const service = new WeatherForecasts(
    providers,
    r as unknown as RedisService,
    log as unknown as PinoLogger,
    timeoutMs,
    20,
  );
  return { service, r, log };
}

describe('WeatherForecasts', () => {
  it('uses the first provider and caches its answer for an hour under the cell key', async () => {
    const first = ok('A');
    const second = ok('B');
    const { service, r } = build([first, second]);
    await expect(service.forCell(cell)).resolves.toEqual({
      forecast,
      source: 'A',
    });
    expect(second.forecast).not.toHaveBeenCalled();
    expect(r.set).toHaveBeenCalledWith(
      'weather:v1:25.6,85.1',
      JSON.stringify({ forecast, source: 'A' }),
      3600,
    );
  });

  it('falls back to the next provider when one fails, and logs only the cell', async () => {
    const { service, log } = build([failing('A'), ok('B')]);
    await expect(service.forCell(cell)).resolves.toEqual({
      forecast,
      source: 'B',
    });
    expect(log.warn).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'A', cell: '25.6,85.1' }),
      'Weather provider failed',
    );
    expect(JSON.stringify(log.warn.mock.calls)).not.toContain('25.61');
  });

  it("logs the provider's HTTP status, so a refused call says why", async () => {
    const refused = provider('A', () =>
      Promise.reject(
        new UpstreamError('WEATHER_UPSTREAM', 'Weather provider failed', {
          provider: 'A',
          status: 429,
        }),
      ),
    );
    const { service, log } = build([refused, ok('B')]);
    await service.forCell(cell);
    expect(log.warn).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'A', status: 429 }),
      'Weather provider failed',
    );
  });

  it('moves on when a provider hangs past the timeout, and aborts its request', async () => {
    let aborted = false;
    const hanging = provider('A', (_c, signal) => {
      signal.addEventListener('abort', () => (aborted = true));
      return new Promise<Forecast>(() => undefined);
    });
    const { service } = build([hanging, ok('B')]);
    await expect(service.forCell(cell)).resolves.toEqual({
      forecast,
      source: 'B',
    });
    expect(aborted).toBe(true);
  });

  it('returns null when every provider fails, and caches nothing (never a made-up forecast)', async () => {
    const { service, r } = build([failing('A'), failing('B')]);
    await expect(service.forCell(cell)).resolves.toBeNull();
    expect(r.set).not.toHaveBeenCalled();
  });

  it('returns null with no providers (weather off) without calling anything', async () => {
    const { service, r } = build([]);
    await expect(service.forCell(cell)).resolves.toBeNull();
    expect(r.get).not.toHaveBeenCalled();
  });

  it('serves a cached forecast without calling providers', async () => {
    const a = ok('A');
    const { service } = build(
      [a],
      redis(JSON.stringify({ forecast, source: 'A' })),
    );
    await expect(service.forCell(cell)).resolves.toEqual({
      forecast,
      source: 'A',
    });
    expect(a.forecast).not.toHaveBeenCalled();
  });

  it('still serves weather when Redis is down', async () => {
    const { service } = build([ok('A')], redis(null, true));
    await expect(service.forCell(cell)).resolves.toEqual({
      forecast,
      source: 'A',
    });
  });

  it('ignores a corrupt cache entry and fetches again', async () => {
    const a = ok('A');
    const { service } = build([a], redis('{not json'));
    await expect(service.forCell(cell)).resolves.toEqual({
      forecast,
      source: 'A',
    });
    expect(a.forecast).toHaveBeenCalled();
  });

  it('serves weather when Redis hangs instead of failing fast', async () => {
    const { service } = build([ok('A')], hangingRedis());
    await expect(service.forCell(cell)).resolves.toEqual({
      forecast,
      source: 'A',
    });
  });

  it('ignores a cached entry that is valid JSON but not a forecast', async () => {
    const a = ok('A');
    const { service } = build(
      [a],
      redis(JSON.stringify({ forecast: {}, source: 'A' })),
    );
    await expect(service.forCell(cell)).resolves.toEqual({
      forecast,
      source: 'A',
    });
    expect(a.forecast).toHaveBeenCalled();
  });
});
