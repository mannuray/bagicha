import { UpstreamError } from '../../../common/errors';
import { gridCell } from '../domain/grid-cell';
import { OpenMeteoProvider } from './open-meteo.provider';

const body = {
  latitude: 25.65,
  longitude: 85.15,
  timezone: 'Asia/Kolkata',
  current: { time: '2026-11-25T14:00', temperature_2m: 27.4, weather_code: 2 },
  daily: {
    time: ['2026-11-25', '2026-11-26', '2026-11-27'],
    weather_code: [2, 61, 0],
    temperature_2m_max: [28.1, 26.0, 27.5],
    temperature_2m_min: [14.2, 15.0, 13.8],
    precipitation_sum: [0, 4.2, 0],
    precipitation_probability_max: [5, 70, 0],
  },
};

function fetchReturning(status: number, json: unknown) {
  return jest.fn((_url: string | URL | Request, _init?: RequestInit) =>
    Promise.resolve(
      new Response(JSON.stringify(json), {
        status,
        headers: { 'content-type': 'application/json' },
      }),
    ),
  );
}

const cell = gridCell(25.61, 85.13);
const signal = new AbortController().signal;

describe('OpenMeteoProvider', () => {
  it('maps the response to our forecast', async () => {
    const provider = new OpenMeteoProvider(
      fetchReturning(200, body),
      undefined,
    );
    await expect(provider.forecast(cell, signal)).resolves.toEqual({
      now: { tempC: 27.4, condition: 'PARTLY_CLOUDY' },
      days: [
        {
          date: '2026-11-25',
          condition: 'PARTLY_CLOUDY',
          maxC: 28.1,
          minC: 14.2,
          rainMm: 0,
          rainChance: 5,
        },
        {
          date: '2026-11-26',
          condition: 'RAIN',
          maxC: 26.0,
          minC: 15.0,
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

  it('asks the free API for the cell centre, in IST, without a key', async () => {
    const fetch = fetchReturning(200, body);
    await new OpenMeteoProvider(fetch, undefined).forecast(cell, signal);
    const url = new URL(fetch.mock.calls[0][0] as string);
    expect(url.host).toBe('api.open-meteo.com');
    expect(url.searchParams.get('latitude')).toBe('25.65');
    expect(url.searchParams.get('longitude')).toBe('85.15');
    expect(url.searchParams.get('timezone')).toBe('Asia/Kolkata');
    expect(url.searchParams.get('forecast_days')).toBe('3');
    expect(url.searchParams.has('apikey')).toBe(false);
    expect(fetch.mock.calls[0][1]?.signal).toBe(signal);
  });

  it('uses the commercial API when a key is set', async () => {
    const fetch = fetchReturning(200, body);
    await new OpenMeteoProvider(fetch, 'k-123').forecast(cell, signal);
    const url = new URL(fetch.mock.calls[0][0] as string);
    expect(url.host).toBe('customer-api.open-meteo.com');
    expect(url.searchParams.get('apikey')).toBe('k-123');
  });

  it('fails on an error status', async () => {
    const provider = new OpenMeteoProvider(
      fetchReturning(429, { error: true }),
      undefined,
    );
    await expect(provider.forecast(cell, signal)).rejects.toBeInstanceOf(
      UpstreamError,
    );
  });

  it('fails on missing values instead of showing NaN', async () => {
    const broken = {
      ...body,
      daily: { ...body.daily, temperature_2m_max: [null, 26.0, 27.5] },
    };
    const provider = new OpenMeteoProvider(
      fetchReturning(200, broken),
      undefined,
    );
    await expect(provider.forecast(cell, signal)).rejects.toBeInstanceOf(
      UpstreamError,
    );
  });

  it('fails when the daily arrays are shorter than the dates', async () => {
    const broken = {
      ...body,
      daily: { ...body.daily, precipitation_sum: [0] },
    };
    const provider = new OpenMeteoProvider(
      fetchReturning(200, broken),
      undefined,
    );
    await expect(provider.forecast(cell, signal)).rejects.toBeInstanceOf(
      UpstreamError,
    );
  });
});
