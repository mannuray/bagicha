import { INestApplication } from '@nestjs/common';
import { PrismaClient, RegionCluster, User } from '@prisma/client';
import request from 'supertest';
import { CATALOGUE_SEED } from '../../src/modules/catalogue';
import { CatalogueRepository } from '../../src/modules/catalogue/catalogue.repository';
import { CataloguePushService } from '../../src/modules/catalogue/push/catalogue-push.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from './app';
import { resetDb, seedUser, tokenFor } from './fixtures';

/** Retiring a crop hides it from the calendar but never breaks a garden that grows it. */
describe('a retired crop', () => {
  let app: INestApplication;
  let user: User;

  const as = (u: User) => {
    const auth = { Authorization: `Bearer ${tokenFor(app, u)}` };
    return {
      get: (url: string) => request(app.getHttpServer()).get(url).set(auth),
      post: (url: string, body: object = {}) =>
        request(app.getHttpServer()).post(url).set(auth).send(body),
    };
  };
  const push = (seed: unknown) =>
    new CataloguePushService(app.get(CatalogueRepository)).push(seed);

  afterAll(async () => {
    await push(CATALOGUE_SEED);
    await app.close();
  });

  it('is gone from the calendar, yet an existing carrot still gets its journey', async () => {
    app = await createTestApp();
    const prisma: PrismaClient = app.get(PrismaService);
    await resetDb(prisma);
    user = await seedUser(prisma, { region_cluster: RegionCluster.EAST_INDIA });
    const carrot = (
      await as(user).post('/api/v1/crops/plan', { crop_id: 'carrot' })
    ).body.data as { id: string };
    await push({
      ...CATALOGUE_SEED,
      crops: CATALOGUE_SEED.crops.map((c) =>
        c.id === 'carrot' ? { ...c, status: 'RETIRED' } : c,
      ),
    });
    await app.close();

    // A fresh API loads the catalogue with carrot retired.
    app = await createTestApp();
    const calendar = (await as(user).get('/api/v1/crops/calendar')).body
      .data as Array<{ id: string }>;
    expect(calendar.map((c) => c.id)).not.toContain('carrot');
    expect(calendar.map((c) => c.id)).toContain('radish');

    const sown = await as(user).post(
      `/api/v1/ledger/plants/${carrot.id}/journal`,
      {
        type: 'SOWING',
        metadata: { method: 'DIRECT' },
      },
    );
    expect(sown.status).toBe(201);
    const tasks = (
      await as(user).get(`/api/v1/ledger/plants/${carrot.id}/tasks`)
    ).body.data as Array<{ title: string }>;
    expect(tasks.map((t) => t.title)).toContain(
      'Check the sown carrot for sprouts',
    );
  });
});
