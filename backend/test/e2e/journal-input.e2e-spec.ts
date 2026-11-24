import { INestApplication } from '@nestjs/common';
import { Plant, PrismaClient, User } from '@prisma/client';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from './app';
import { resetDb, seedPlant, seedUser, tokenFor } from './fixtures';

describe('what a gardener may post', () => {
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

  const post = (url: string, body: object) =>
    request(app.getHttpServer())
      .post(`/api/v1/${url}`)
      .set('Authorization', `Bearer ${tokenFor(app, user)}`)
      .send(body);
  const log = (body: object) => post(`ledger/plants/${plant.id}/journal`, body);

  it.each(['PLANT_ENDED', 'DIAGNOSIS'])(
    'refuses the system-written entry type %s',
    async (type) => {
      expect((await log({ type, content: 'x' })).status).toBe(422);
    },
  );

  it.each([
    { secret: 1 },
    { severity: 'APOCALYPTIC' },
    { quantity_value: -3 },
    { quantity_unit: 'tonnes' },
    { quality: 'meh' },
    { method: 'TELEPORT' },
  ])('refuses metadata %o', async (metadata) => {
    expect((await log({ type: 'HARVEST', metadata })).status).toBe(422);
  });

  it.each([
    {
      type: 'FRUIT_DROP',
      metadata: { severity: 'HIGH', photo_key: 'journal/u/x.jpg' },
    },
    {
      type: 'HARVEST',
      metadata: { quantity_value: 10, quantity_unit: 'kg', quality: 'good' },
    },
    { type: 'NOTE' },
  ])('accepts what the web sends: %o', async (body) => {
    expect((await log(body)).status).toBe(201);
  });

  const finalize = (extra: object) =>
    post('diagnosis/finalize', {
      subject_type: 'TREE',
      subject_id: plant.id,
      primary_issue: 'PEST',
      severity: 'MEDIUM',
      reasoning_summary: 'Aphids',
      recommended_actions: ['Spray neem'],
      ...extra,
    });

  it('refuses untyped or oversized diagnosis attachments and messages', async () => {
    expect(
      (await finalize({ attachments: [{ kind: 'x'.repeat(50) }] })).status,
    ).toBe(422);
    expect(
      (
        await finalize({
          attachments: Array.from({ length: 11 }, () => ({ kind: 'image' })),
        })
      ).status,
    ).toBe(422);
    expect(
      (await finalize({ messages: [{ role: 'robot', content: 'hi' }] })).status,
    ).toBe(422);
    expect(
      (
        await finalize({
          messages: [{ role: 'user', content: 'x'.repeat(2001) }],
        })
      ).status,
    ).toBe(422);
  });

  it('accepts typed diagnosis attachments and messages', async () => {
    const res = await finalize({
      attachments: [{ kind: 'image', source: 'camera' }],
      messages: [{ role: 'user', content: 'leaves curling' }],
    });
    expect(res.status).toBe(200);
  });
});
