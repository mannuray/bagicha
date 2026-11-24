import { INestApplication } from '@nestjs/common';
import { Plant, PrismaClient, User } from '@prisma/client';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from './app';
import { resetDb, seedPlant, seedUser, tokenFor } from './fixtures';

/** The consistent route names answer exactly like the old ones they sit beside. */
describe('consistent route names', () => {
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
  const same = (a: request.Response, b: request.Response) => {
    expect(b.status).toBe(a.status);
    const strip = (d: Record<string, unknown>) => {
      const { updated_at: _u, ...rest } = d ?? {};
      return rest;
    };
    expect(strip(b.body.data)).toEqual(strip(a.body.data));
  };

  it('PATCH user/profile = PUT user/profile/update', async () => {
    same(
      await call('put', 'user/profile/update', { name: 'Asha' }),
      await call('patch', 'user/profile', { name: 'Asha' }),
    );
  });

  it('PATCH ledger/plants/:id = PUT ledger/plants/:id', async () => {
    same(
      await call('put', `ledger/plants/${plant.id}`, { variety: 'Dasheri' }),
      await call('patch', `ledger/plants/${plant.id}`, { variety: 'Dasheri' }),
    );
  });

  it('PATCH ledger/plants/:id/tasks/:taskId = PUT', async () => {
    const task = await prisma.task.create({
      data: {
        plant_id: plant.id,
        type: 'WATER',
        source: 'MANUAL',
        due_date: new Date('2026-12-01T00:00:00Z'),
      },
    });
    const url = `ledger/plants/${plant.id}/tasks/${task.id}`;
    const put = await call('put', url, { status: 'COMPLETED' });
    expect(put.status).toBe(200);
    await prisma.task.update({
      where: { id: task.id },
      data: { status: 'PENDING', completed_at: null },
    });
    const patch = await call('patch', url, { status: 'COMPLETED' });
    expect(patch.status).toBe(200);
    expect(patch.body.data.status).toBe('COMPLETED');
  });

  it('seasonal/plants/:id/... = seasonal/plant/:id/...', async () => {
    same(
      await call('get', `seasonal/plant/${plant.id}/intelligence`),
      await call('get', `seasonal/plants/${plant.id}/intelligence`),
    );
    const old = await call(
      'post',
      `seasonal/plant/${plant.id}/materialize-tasks`,
    );
    const plural = await call(
      'post',
      `seasonal/plants/${plant.id}/materialize-tasks`,
    );
    expect(plural.status).toBe(old.status);
  });
});
