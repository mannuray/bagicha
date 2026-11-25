import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { WeatherForecasts } from '../../src/modules/weather/weather-forecasts';
import type { GridCell } from '../../src/modules/weather/domain/grid-cell';
import { createTestApp } from './app';
import { resetDb, seedUser, tokenFor } from './fixtures';

const forecast = {
  now: { tempC: 27.4, condition: 'PARTLY_CLOUDY' },
  days: [
    {
      date: '2026-11-25',
      condition: 'PARTLY_CLOUDY',
      maxC: 28.1,
      minC: 14.2,
      rainMm: 0.4,
      rainChance: 10,
    },
    {
      date: '2026-11-26',
      condition: 'RAIN',
      maxC: 26,
      minC: 15,
      rainMm: 4.2,
      rainChance: 70,
    },
  ],
};

/** GET weather: real weather for the user's place, or null, never made up. */
describe('weather', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  const cells: GridCell[] = [];
  let answer: unknown = { forecast, source: 'Open-Meteo' };

  beforeAll(async () => {
    app = await createTestApp((b) =>
      b.overrideProvider(WeatherForecasts).useValue({
        forCell: (cell: GridCell) => {
          cells.push(cell);
          return Promise.resolve(answer);
        },
      }),
    );
    prisma = app.get(PrismaService);
  });
  beforeEach(async () => {
    await resetDb(prisma);
    cells.length = 0;
    answer = { forecast, source: 'Open-Meteo' };
  });
  afterAll(async () => {
    await app.close();
  });

  const get = async (user: Parameters<typeof tokenFor>[1], path = 'weather') =>
    request(app.getHttpServer())
      .get(`/api/v1/${path}`)
      .set('Authorization', `Bearer ${tokenFor(app, user)}`);

  it("returns now and today for the user's district", async () => {
    const user = await seedUser(prisma);
    await prisma.user.update({
      where: { id: user.id },
      data: { district: 'Patna' },
    });
    const res = await get(user);
    expect(res.status).toBe(200);
    expect(res.body.data ?? res.body).toEqual({
      weather: {
        now: { temp_c: 27.4, condition: 'PARTLY_CLOUDY' },
        today: { max_c: 28.1, min_c: 14.2, rain_chance: 10, rain_mm: 0.4 },
      },
      tip: null,
      source: 'Open-Meteo',
    });
    expect(cells).toHaveLength(1);
  });

  it('uses the saved point, snapped to the grid', async () => {
    const user = await seedUser(prisma);
    await prisma.user.update({
      where: { id: user.id },
      data: { latitude: 25.6123, longitude: 85.1376 },
    });
    await get(user);
    expect(cells[0].key).toBe('25.6,85.1');
  });

  it('returns null weather when the user has no place', async () => {
    const user = await seedUser(prisma);
    await prisma.user.update({
      where: { id: user.id },
      data: { district: null, latitude: null, longitude: null },
    });
    const res = await get(user);
    expect(res.status).toBe(200);
    expect(res.body.data ?? res.body).toEqual({
      weather: null,
      tip: null,
      source: null,
    });
    expect(cells).toHaveLength(0);
  });

  it('returns null weather when no provider answers', async () => {
    const user = await seedUser(prisma);
    await prisma.user.update({
      where: { id: user.id },
      data: { district: 'Patna' },
    });
    answer = null;
    const res = await get(user);
    expect(res.body.data ?? res.body).toEqual({
      weather: null,
      tip: null,
      source: null,
    });
  });

  const hot = {
    forecast: {
      ...forecast,
      days: [{ ...forecast.days[0], maxC: 41 }, forecast.days[1]],
    },
    source: 'Open-Meteo',
  };

  it("adds the tip for a very hot day, in the gardener's language", async () => {
    const user = await seedUser(prisma);
    await prisma.user.update({
      where: { id: user.id },
      data: { district: 'Patna' },
    });
    answer = hot;
    const en = await get(user);
    expect((en.body.data ?? en.body).tip).toMatch(/^Very hot day ahead/);
    const hi = await request(app.getHttpServer())
      .get('/api/v1/weather')
      .set('Authorization', `Bearer ${tokenFor(app, user)}`)
      .set('Accept-Language', 'hi');
    expect((hi.body.data ?? hi.body).tip).toMatch(/^बहुत गर्म दिन/);
  });

  it('uses the hills limit for a hills gardener (30 °C is very hot there, not in the plains)', async () => {
    const user = await seedUser(prisma);
    await prisma.user.update({
      where: { id: user.id },
      data: { district: 'Shimla' },
    });
    answer = {
      ...hot,
      forecast: { ...hot.forecast, days: [{ ...forecast.days[0], maxC: 31 }] },
    };
    expect(((await get(user)).body.data ?? {}).tip).toMatch(
      /^Very hot day ahead/,
    );
    await prisma.user.update({
      where: { id: user.id },
      data: { district: 'Patna' },
    });
    expect(((await get(user)).body.data ?? {}).tip).toBeNull();
  });

  it('has removed the old fixed-pincode route', async () => {
    const user = await seedUser(prisma);
    expect((await get(user, 'seasonal/weather')).status).toBe(404);
  });

  it('needs a signed-in user', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/weather');
    expect(res.status).toBe(401);
  });
});
