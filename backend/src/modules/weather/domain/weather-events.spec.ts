import type { Forecast, ForecastDay } from './forecast';
import { WEATHER_LIMITS, weatherEvents } from './weather-events';

const day = (date: string, d: Partial<ForecastDay> = {}): ForecastDay => ({
  date,
  condition: 'CLEAR',
  maxC: 25,
  minC: 15,
  rainMm: 0,
  rainChance: 0,
  ...d,
});
const forecast = (...days: ForecastDay[]): Forecast => ({
  now: { tempC: 25, condition: 'CLEAR' },
  days,
});
const plains = { hills: false };
const hills = { hills: true };

describe('weather limits (owner approved 2026-11-25, IMD-based)', () => {
  it('pins the approved values', () => {
    expect(WEATHER_LIMITS).toEqual({
      heatMaxC: { plains: 40, hills: 30 },
      heavyRainMm: 64.5,
      heavyRainChance: 50,
      coldMinC: { plains: 4, hills: 0 },
    });
  });
});

describe('weatherEvents', () => {
  it('finds nothing on an ordinary day', () => {
    expect(
      weatherEvents(forecast(day('2026-11-25'), day('2026-11-26')), plains),
    ).toEqual([]);
  });

  it('flags a very hot day at 40 °C in the plains, not 39.9', () => {
    expect(
      weatherEvents(forecast(day('2026-05-10', { maxC: 39.9 })), plains),
    ).toEqual([]);
    expect(
      weatherEvents(forecast(day('2026-05-10', { maxC: 40 })), plains),
    ).toEqual([{ kind: 'HEAT', date: '2026-05-10', value: 40 }]);
  });

  it('flags a very hot day at 30 °C in the hills', () => {
    expect(
      weatherEvents(forecast(day('2026-06-01', { maxC: 30 })), hills),
    ).toEqual([{ kind: 'HEAT', date: '2026-06-01', value: 30 }]);
    expect(
      weatherEvents(forecast(day('2026-06-01', { maxC: 30 })), plains),
    ).toEqual([]);
  });

  it('flags heavy rain only with 64.5 mm and at least a 50% chance', () => {
    const rain = (rainMm: number, rainChance: number) =>
      weatherEvents(
        forecast(day('2026-07-20', { rainMm, rainChance })),
        plains,
      );
    expect(rain(64.5, 50)).toEqual([
      { kind: 'HEAVY_RAIN', date: '2026-07-20', value: 64.5 },
    ]);
    expect(rain(64.4, 90)).toEqual([]);
    expect(rain(120, 49)).toEqual([]);
  });

  it('flags a cold night at 4 °C in the plains and 0 °C in the hills, dated the evening before', () => {
    // Tomorrow's low comes around dawn: tonight is the cold night, so the event is today.
    const tonight = (minC: number, place: { hills: boolean }) =>
      weatherEvents(
        forecast(day('2027-01-04'), day('2027-01-05', { minC })),
        place,
      );
    expect(tonight(4, plains)).toEqual([
      { kind: 'COLD_NIGHT', date: '2027-01-04', value: 4 },
    ]);
    expect(tonight(4, hills)).toEqual([]);
    expect(tonight(0, hills)).toEqual([
      { kind: 'COLD_NIGHT', date: '2027-01-04', value: 0 },
    ]);
  });

  it("ignores today's low: that night has already passed", () => {
    expect(
      weatherEvents(
        forecast(day('2027-01-04', { minC: 1 }), day('2027-01-05')),
        plains,
      ),
    ).toEqual([]);
  });

  it('looks at today and tomorrow only, in date order', () => {
    const events = weatherEvents(
      forecast(
        day('2026-05-10'),
        day('2026-05-11', { maxC: 42 }),
        day('2026-05-12', { maxC: 44 }),
      ),
      plains,
    );
    expect(events).toEqual([{ kind: 'HEAT', date: '2026-05-11', value: 42 }]);
  });

  it("puts tonight's cold before tomorrow's events", () => {
    const events = weatherEvents(
      forecast(
        day('2027-01-04'),
        day('2027-01-05', { minC: 2, rainMm: 70, rainChance: 90 }),
      ),
      plains,
    );
    expect(events.map((e) => [e.kind, e.date])).toEqual([
      ['COLD_NIGHT', '2027-01-04'],
      ['HEAVY_RAIN', '2027-01-05'],
    ]);
  });

  it('can find two kinds on one day, heavy rain first', () => {
    const events = weatherEvents(
      forecast(day('2026-06-15', { maxC: 41, rainMm: 80, rainChance: 80 })),
      plains,
    );
    expect(events.map((e) => e.kind)).toEqual(['HEAVY_RAIN', 'HEAT']);
  });

  it('drops events before `from`: a forecast cached last evening still starts with yesterday', () => {
    const events = weatherEvents(
      forecast(
        day('2026-05-10', { maxC: 42 }),
        day('2026-05-11', { maxC: 41 }),
      ),
      plains,
      '2026-05-11',
    );
    expect(events).toEqual([{ kind: 'HEAT', date: '2026-05-11', value: 41 }]);
  });
});
