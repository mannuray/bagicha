import { INestApplication } from '@nestjs/common';
import { PrismaClient, User } from '@prisma/client';
import { randomUUID } from 'crypto';
import request from 'supertest';
import { UserRepository } from '../../src/modules/user';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from './app';
import { resetDb, seedPlant, seedUser, tokenFor } from './fixtures';

/** Errors and request ids, per the safety rules adopted from the OPD standard. */
describe('safe errors and request ids', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let alice: User;
  let bob: User;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });
  beforeEach(async () => {
    await resetDb(prisma);
    alice = await seedUser(prisma);
    bob = await seedUser(prisma);
  });
  afterAll(async () => {
    await app.close();
  });

  const as = (user: User) => ({
    Authorization: `Bearer ${tokenFor(app, user)}`,
  });

  it('every response carries X-Request-ID, and an error body repeats it', async () => {
    const ok = await request(app.getHttpServer()).get('/api/v1/health/live');
    expect(ok.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    expect(ok.body.request_id).toBe(ok.headers['x-request-id']);
    const bad = await request(app.getHttpServer())
      .get('/api/v1/ledger/plants')
      .set('Authorization', 'Bearer nope');
    expect(bad.status).toBe(401);
    expect(bad.body.error.request_id).toBe(bad.headers['x-request-id']);
  });

  it('uses a well-formed client request id, and replaces a malformed one', async () => {
    const mine = await request(app.getHttpServer())
      .get('/api/v1/health/live')
      .set('X-Request-ID', 'web-1a2b3c4d');
    expect(mine.headers['x-request-id']).toBe('web-1a2b3c4d');
    const junk = await request(app.getHttpServer())
      .get('/api/v1/health/live')
      .set('X-Request-ID', '<script>alert(1)</script>');
    expect(junk.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('an error names the route pattern, never the real URL with its ids or query', async () => {
    const theirs = await seedPlant(prisma, bob.id);
    const res = await request(app.getHttpServer())
      .get(`/api/v1/ledger/plants/${theirs.id}?secret=1`)
      .set(as(alice));
    expect(res.status).toBe(404);
    expect(res.body.error.path).toBe('/api/v1/ledger/plants/:id');
  });

  it("an unknown route gets fixed wording, not Nest's text echoing the URL", async () => {
    const id = randomUUID();
    const res = await request(app.getHttpServer())
      .get(`/api/v1/nowhere/${id}`)
      .set(as(alice));
    expect(res.status).toBe(404);
    expect(JSON.stringify(res.body)).not.toContain(id);
    expect(res.body.error.message).toBe('Not found');
  });

  it('commenting on a post that does not exist is a 404, not a 500', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/community/posts/${randomUUID()}/comments`)
      .set(as(alice))
      .send({ content: 'Same here' });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('POST_NOT_FOUND');
  });

  it('two first sign-ins for the same phone at once both succeed', async () => {
    const phone = '+919000001234';
    const users = app.get(UserRepository);
    const [a, b] = await Promise.all([
      users.findOrCreateByPhone(phone),
      users.findOrCreateByPhone(phone),
    ]);
    expect(a.user.id).toBe(b.user.id);
    expect([a.created, b.created].filter(Boolean)).toHaveLength(1);
  });
});
