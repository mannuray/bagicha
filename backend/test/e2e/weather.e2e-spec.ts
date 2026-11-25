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
    expect(res.body.data ?? res.body).toEqual({ weather: null, source: null });
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
    expect(res.body.data ?? res.body).toEqual({ weather: null, source: null });
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
