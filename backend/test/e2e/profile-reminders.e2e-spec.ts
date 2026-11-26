import { INestApplication } from '@nestjs/common';
import { PrismaClient, User } from '@prisma/client';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from './app';
import { resetDb, seedUser, tokenFor } from './fixtures';

describe('reminder times on the profile', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let alice: User;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });
  beforeEach(async () => {
    await resetDb(prisma);
    alice = await seedUser(prisma);
  });
  afterAll(async () => {
    await app.close();
  });

  const patch = (body: object) =>
    request(app.getHttpServer())
      .patch('/api/v1/user/profile')
      .set('Authorization', `Bearer ${tokenFor(app, alice)}`)
      .send(body);

  it('starts at 07:00 and 18:00', async () => {
    const res = await patch({}).expect(200);
    expect(res.body.data).toMatchObject({
      reminder_morning_min: 420,
      reminder_evening_min: 1080,
    });
  });

  it('saves a morning time on a quarter-hour', async () => {
    const res = await patch({ reminder_morning_min: 405 }).expect(200);
    expect(res.body.data.reminder_morning_min).toBe(405);
  });

  it('turns the evening off with null', async () => {
    const res = await patch({ reminder_evening_min: null }).expect(200);
    expect(res.body.data.reminder_evening_min).toBeNull();
    const row = await prisma.user.findUniqueOrThrow({
      where: { id: alice.id },
    });
    expect(row.reminder_evening_min).toBeNull();
  });

  it.each([
    ['before 06:00', { reminder_morning_min: 300 }],
    ['off the 15-minute steps', { reminder_morning_min: 410 }],
    ['a morning time in the evening', { reminder_evening_min: 420 }],
    ['after 21:45', { reminder_evening_min: 1320 }],
  ])('refuses a time %s', async (_label, body) => {
    await patch(body).expect(422);
  });
});
