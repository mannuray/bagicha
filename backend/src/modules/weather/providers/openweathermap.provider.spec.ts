import { UpstreamError } from '../../../common/errors';
import { gridCell } from '../domain/grid-cell';
import { OpenWeatherMapProvider } from './openweathermap.provider';

// Times are UTC epoch seconds; IST is UTC+5:30.
const at = (iso: string) => Date.parse(iso) / 1000;

const current = {
  dt: at('2026-11-25T08:30:00Z'), // 14:00 IST on 25 Nov
  main: { temp: 27.4 },
  weather: [{ id: 802 }],
};

const slot = (
  iso: string,
  temp: [number, number],
  id: number,
  pop: number,
  rain3h?: number,
) => ({
  dt: at(iso),
  main: { temp_min: temp[0], temp_max: temp[1] },
  weather: [{ id }],
  pop,
  ...(rain3h === undefined ? {} : { rain: { '3h': rain3h } }),
});

const forecast = {
  list: [
    // 25 Nov IST (rest of today)
    slot('2026-11-25T09:30:00Z', [27, 28.1], 801, 0.05),
    slot('2026-11-25T15:30:00Z', [19, 20], 800, 0),
    // 26 Nov IST: 18:30Z on the 25th is 00:00 IST on the 26th
    slot('2026-11-25T18:30:00Z', [15, 16], 500, 0.4, 1.2),
    slot('2026-11-26T06:30:00Z', [25, 26], 502, 0.7, 3),
    // 27 Nov IST
    slot('2026-11-26T21:30:00Z', [13.8, 14], 800, 0),
    slot('2026-11-27T09:30:00Z', [27, 27.5], 800, 0),
    // 28 Nov IST: beyond the three days we return
    slot('2026-11-27T21:30:00Z', [12, 13], 800, 0),
  ],
};

const href = (u: string | URL | Request) =>
  typeof u === 'string' ? u : u instanceof URL ? u.href : u.url;

function fetchFor(
  responses: Record<'weather' | 'forecast', { status: number; json: unknown }>,
) {
  return jest.fn((url: string | URL | Request, _init?: RequestInit) => {
    const path = new URL(href(url)).pathname;
    const r = path.endsWith('/forecast')
      ? responses.forecast
      : responses.weather;
    return Promise.resolve(
      new Response(JSON.stringify(r.json), {
        status: r.status,
        headers: { 'content-type': 'application/json' },
      }),
    );
  });
}

const ok = () =>
  fetchFor({
    weather: { status: 200, json: current },
    forecast: { status: 200, json: forecast },
  });

const cell = gridCell(25.61, 85.13);
const signal = new AbortController().signal;

describe('OpenWeatherMapProvider', () => {
  it('builds now and three IST days from current weather and 3-hour slots', async () => {
    const provider = new OpenWeatherMapProvider(ok(), 'key-1');
    await expect(provider.forecast(cell, signal)).resolves.toEqual({
      now: { tempC: 27.4, condition: 'PARTLY_CLOUDY' },
      days: [
        {
          date: '2026-11-25',
          condition: 'PARTLY_CLOUDY',
          maxC: 28.1,
          minC: 19,
          rainMm: 0,
          rainChance: 5,
        },
        {
          date: '2026-11-26',
          condition: 'HEAVY_RAIN',
          maxC: 26,
          minC: 15,
          rainMm: 4.2,
          rainChance: 70,
        },
        {
          date: '2026-11-27',
          condition: 'CLEAR',
          maxC: 27.5,
          minC: 13.8,
          rainMm: 0,
          rainChance: 0,
        },
      ],
    });
  });

  it('counts the current reading in today when no slots are left today', async () => {
    const late = { ...current, dt: at('2026-11-25T18:15:00Z') }; // 23:45 IST
    const provider = new OpenWeatherMapProvider(
      fetchFor({
        weather: { status: 200, json: late },
        forecast: { status: 200, json: { list: forecast.list.slice(2) } },
      }),
      'key-1',
    );
    const result = await provider.forecast(cell, signal);
    expect(result.days[0]).toEqual({
      date: '2026-11-25',
      condition: 'PARTLY_CLOUDY',
      maxC: 27.4,
      minC: 27.4,
      rainMm: 0,
      rainChance: 0,
    });
    expect(result.days.map((d) => d.date)).toEqual([
      '2026-11-25',
      '2026-11-26',
      '2026-11-27',
    ]);
  });

  it('asks for metric units, the grid cell and the key', async () => {
    const fetch = ok();
    await new OpenWeatherMapProvider(fetch, 'key-1').forecast(cell, signal);
    const urls = fetch.mock.calls.map(([u]) => new URL(href(u)));
    expect(urls.map((u) => u.pathname).sort()).toEqual([
      '/data/2.5/forecast',
      '/data/2.5/weather',
    ]);
    for (const u of urls) {
      expect(u.searchParams.get('lat')).toBe(String(cell.lat));
      expect(u.searchParams.get('lon')).toBe(String(cell.lng));
      expect(u.searchParams.get('units')).toBe('metric');
      expect(u.searchParams.get('appid')).toBe('key-1');
    }
  });

  it('throws an upstream error carrying the status on a failed call', async () => {
    const provider = new OpenWeatherMapProvider(
      fetchFor({
        weather: { status: 200, json: current },
        forecast: { status: 429, json: { cod: 429 } },
      }),
      'key-1',
    );
    const err = await provider.forecast(cell, signal).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(UpstreamError);
    expect(err).toMatchObject({
      reason: 'WEATHER_UPSTREAM',
      details: { provider: 'OpenWeather', status: 429 },
    });
  });

  it('treats a response it cannot read as a failure', async () => {
    const provider = new OpenWeatherMapProvider(
      fetchFor({
        weather: { status: 200, json: { main: {} } },
        forecast: { status: 200, json: forecast },
      }),
      'key-1',
    );
    await expect(provider.forecast(cell, signal)).rejects.toMatchObject({
      reason: 'WEATHER_MALFORMED',
    });
  });

  it('treats a forecast that does not reach the day after tomorrow as a failure', async () => {
    const provider = new OpenWeatherMapProvider(
      fetchFor({
        weather: { status: 200, json: current },
        forecast: { status: 200, json: { list: forecast.list.slice(0, 4) } },
      }),
      'key-1',
    );
    await expect(provider.forecast(cell, signal)).rejects.toMatchObject({
      reason: 'WEATHER_MALFORMED',
    });
  });
});

describe('OpenWeatherMap condition codes', () => {
  it.each([
    [211, 'THUNDERSTORM'],
    [301, 'DRIZZLE'],
    [500, 'RAIN'],
    [502, 'HEAVY_RAIN'],
    [522, 'HEAVY_RAIN'],
    [601, 'SNOW'],
    [741, 'FOG'],
    [721, 'CLOUDY'],
    [800, 'CLEAR'],
    [802, 'PARTLY_CLOUDY'],
    [804, 'CLOUDY'],
  ])('%i → %s', async (id, condition) => {
    const provider = new OpenWeatherMapProvider(
      fetchFor({
        weather: { status: 200, json: { ...current, weather: [{ id }] } },
        forecast: { status: 200, json: forecast },
      }),
      'key-1',
    );
    const result = await provider.forecast(cell, signal);
    expect(result.now.condition).toBe(condition);
  });
});
