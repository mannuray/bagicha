import { INestApplication } from '@nestjs/common';
import { PrismaClient, RegionCluster, User } from '@prisma/client';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from './app';
import { resetDb, seedUser, tokenFor } from './fixtures';

describe('regions', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let alice: User;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });
  beforeEach(async () => {
    await resetDb(prisma);
    alice = await seedUser(prisma, {
      region_cluster: RegionCluster.EAST_INDIA,
    });
  });
  afterAll(async () => {
    await app.close();
  });

  const get = (url: string, user?: User) => {
    const r = request(app.getHttpServer()).get(url);
    return user ? r.set({ Authorization: `Bearer ${tokenFor(app, user)}` }) : r;
  };

  it('needs a signed-in user', async () => {
    expect((await get('/api/v1/regions/districts')).status).toBe(401);
    expect((await get('/api/v1/regions/locate?lat=25.6&lng=85.1')).status).toBe(
      401,
    );
  });

  it('lists every selectable district with its region and label', async () => {
    const res = await get('/api/v1/regions/districts', alice);
    expect(res.body.data.length).toBeGreaterThanOrEqual(770);
    expect(res.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Gaya',
          state: 'Bihar',
          region: 'EAST_INDIA',
          label: 'Gaya',
        }),
        expect.objectContaining({
          name: 'Aurangabad',
          state: 'Bihar',
          label: 'Aurangabad, Bihar',
        }),
      ]),
    );
    expect(
      res.body.data.some(
        (d: { name: string }) => d.name === 'Pakistan-occupied Kashmir',
      ),
    ).toBe(false);
  });

  it('finds the district at a location, and nothing outside India', async () => {
    const patna = await get(
      '/api/v1/regions/locate?lat=25.594&lng=85.137',
      alice,
    );
    expect(patna.body.data).toMatchObject({
      district: 'Patna',
      state: 'Bihar',
      region: 'EAST_INDIA',
    });
    expect(
      (await get('/api/v1/regions/locate?lat=51.5&lng=-0.1', alice)).body.data,
    ).toBeNull();
    expect(
      (await get('/api/v1/regions/locate?lat=abc&lng=85', alice)).body.data,
    ).toBeNull();
  });
});
