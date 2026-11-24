import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient, User } from '@prisma/client';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from './app';
import { resetDb, seedUser, tokenFor } from './fixtures';

describe('sign-in tokens use one algorithm', () => {
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

  const plants = (token: string) =>
    request(app.getHttpServer())
      .get('/api/v1/ledger/plants')
      .set('Authorization', `Bearer ${token}`);

  it('accepts an HS256 token', async () => {
    expect((await plants(tokenFor(app, user))).status).toBe(200);
  });

  it('refuses a token signed with another algorithm, even with the right secret', async () => {
    const hs512 = app
      .get(JwtService)
      .sign({ sub: user.id }, { algorithm: 'HS512' });
    expect((await plants(hs512)).status).toBe(401);
  });

  it('issues HS256 tokens', () => {
    const [header] = tokenFor(app, user).split('.');
    expect(
      JSON.parse(Buffer.from(header, 'base64url').toString()),
    ).toMatchObject({
      alg: 'HS256',
    });
  });
});
