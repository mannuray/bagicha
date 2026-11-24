import { INestApplication } from '@nestjs/common';
import { Plant, PrismaClient, User } from '@prisma/client';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from './app';
import { resetDb, seedPlant, seedUser, tokenFor } from './fixtures';

/** One name per action: PATCH for partial updates, plural resources, no verbs in paths. */
describe('route names', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let user: User;
  let plant: Plant;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });
  beforeEach(async () => {
    await resetDb(prisma);
    user = await seedUser(prisma);
    plant = await seedPlant(prisma, user.id);
  });
  afterAll(async () => {
    await app.close();
  });

  const call = (
    method: 'get' | 'post' | 'put' | 'patch',
    url: string,
    body?: object,
  ) =>
    request(app.getHttpServer())
      [method](`/api/v1/${url}`)
      .set('Authorization', `Bearer ${tokenFor(app, user)}`)
      .send(body);

  it('answers on the consistent names', async () => {
    expect((await call('patch', 'user/profile', { name: 'Asha' })).status).toBe(
      200,
    );
    expect(
      (await call('patch', `ledger/plants/${plant.id}`, { variety: 'Dasheri' }))
        .status,
    ).toBe(200);
    const task = await prisma.task.create({
      data: {
        plant_id: plant.id,
        type: 'WATER',
        source: 'MANUAL',
        due_date: new Date('2026-12-01T00:00:00Z'),
      },
    });
    expect(
      (
        await call('patch', `ledger/plants/${plant.id}/tasks/${task.id}`, {
          status: 'COMPLETED',
        })
      ).status,
    ).toBe(200);
    expect(
      (await call('get', `seasonal/plants/${plant.id}/intelligence`)).status,
    ).toBe(200);
  });

  it.each([
    ['put', 'user/profile/update'],
    ['put', 'ledger/plants/P'],
    ['put', 'ledger/plants/P/tasks/T'],
    ['get', 'seasonal/plant/P/intelligence'],
    ['post', 'seasonal/plant/P/materialize-tasks'],
  ] as const)('the old %s %s is gone', async (method, path) => {
    const res = await call(
      method,
      path.replace('P', plant.id).replace('T', 'x'),
      {},
    );
    expect(res.status).toBe(404);
  });
});
