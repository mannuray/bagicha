import { INestApplication } from '@nestjs/common';
import { PrismaClient, User } from '@prisma/client';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from './app';
import { resetDb, seedUser, tokenFor } from './fixtures';

/** Spec 2026-11-11-old-tree-milestones: trees added long after they first fruited. */
describe('old trees', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let user: User;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });
  beforeEach(async () => {
    await resetDb(prisma);
    user = await seedUser(prisma);
  });
  afterAll(async () => {
    await app.close();
  });

  const call = (method: 'post' | 'put' | 'get', url: string, body?: object) => {
    const req = request(app.getHttpServer())
      [method](`/api/v1/ledger${url}`)
      .set('Authorization', `Bearer ${tokenFor(app, user)}`);
    return body ? req.send(body) : req;
  };
  const addTree = async (body: object) => {
    const res = await call('post', '/plants', {
      name: 'Aam',
      species: 'Mango',
      record_kind: 'TREE',
      ...body,
    });
    return res;
  };
  const log = (id: string, type: string) =>
    call('post', `/plants/${id}/journal`, { type });
  const row = (id: string) => prisma.plant.findUniqueOrThrow({ where: { id } });

  it('stores "already fruits, since 2019"', async () => {
    const res = await addTree({
      planting_date: '2017',
      bearing_status: 'BEARING',
      bearing_since_year: 2019,
    });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      bearing_status: 'BEARING',
      bearing_since_year: 2019,
    });
  });

  it('refuses a since-year in the future or before the planted year', async () => {
    const future = await addTree({
      bearing_status: 'BEARING',
      bearing_since_year: new Date().getFullYear() + 1,
    });
    expect(future.status).toBe(422);
    const early = await addTree({
      planting_date: '2017',
      bearing_status: 'BEARING',
      bearing_since_year: 2015,
    });
    expect(early.status).toBe(422);
  });

  it('drops a since-year sent with "not yet"', async () => {
    const res = await addTree({
      bearing_status: 'NOT_YET',
      bearing_since_year: 2019,
    });
    expect(res.status).toBe(201);
    expect(res.body.data.bearing_since_year).toBeNull();
  });

  it('a flowering logged on an old tree (not sure) is not its first; on a young one it is', async () => {
    const old = (await addTree({ planting_date: '2017' })).body.data
      .id as string;
    const young = (
      await addTree({ planting_date: String(new Date().getFullYear()) })
    ).body.data.id as string;
    expect((await log(old, 'FLOWERING')).status).toBe(201);
    expect((await log(young, 'FLOWERING')).status).toBe(201);
    expect((await row(old)).first_flowering_at).toBeNull();
    expect((await row(young)).first_flowering_at).not.toBeNull();
  });

  it('a harvest on a tree that already fruits updates the latest harvest only', async () => {
    const id = (
      await addTree({ planting_date: '2025', bearing_status: 'BEARING' })
    ).body.data.id as string;
    await log(id, 'HARVEST');
    const plant = await row(id);
    expect(plant.first_harvest_at).toBeNull();
    expect(plant.latest_harvest_at).not.toBeNull();
  });

  it('answering "yes, since 2019" clears firsts wrongly recorded later', async () => {
    const id = (await addTree({ planting_date: '2017' })).body.data
      .id as string;
    await prisma.plant.update({
      where: { id },
      data: {
        first_flowering_at: new Date('2026-03-01'),
        first_harvest_at: new Date('2018-06-01'),
      },
    });
    const res = await call('put', `/plants/${id}`, {
      bearing_status: 'BEARING',
      bearing_since_year: 2019,
    });
    expect(res.status).toBe(200);
    const plant = await row(id);
    expect(plant.first_flowering_at).toBeNull();
    expect(plant.first_harvest_at).toEqual(new Date('2018-06-01'));
  });

  it('switching a tree to a flower clears its bearing answer', async () => {
    const id = (
      await addTree({ bearing_status: 'BEARING', bearing_since_year: 2020 })
    ).body.data.id as string;
    await call('put', `/plants/${id}`, { record_kind: 'FLOWER' });
    const plant = await row(id);
    expect(plant.bearing_status).toBeNull();
    expect(plant.bearing_since_year).toBeNull();
  });
});
