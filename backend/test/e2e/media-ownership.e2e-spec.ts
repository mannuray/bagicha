import { INestApplication } from '@nestjs/common';
import { PrismaClient, User } from '@prisma/client';
import sharp from 'sharp';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from './app';
import { resetDb, seedUser, tokenFor } from './fixtures';

describe('media download-url ownership', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let alice: User;
  let bob: User;
  let png: Buffer;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    png = await sharp({
      create: { width: 4, height: 4, channels: 3, background: '#2d4739' },
    })
      .png()
      .toBuffer();
  });

  beforeEach(async () => {
    await resetDb(prisma);
    alice = await seedUser(prisma);
    bob = await seedUser(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  const upload = async (user: User, kind: string): Promise<string> => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/media/images')
      .set('Authorization', `Bearer ${tokenFor(app, user)}`)
      .field('kind', kind)
      .attach('file', png, { filename: 'x.png', contentType: 'image/png' });
    expect(res.status).toBe(201);
    return (res.body.data.key ?? res.body.data.data.key) as string;
  };

  const downloadUrl = (user: User, key: string) =>
    request(app.getHttpServer())
      .get(`/api/v1/media/download-url/${key}`)
      .set('Authorization', `Bearer ${tokenFor(app, user)}`);

  it("returns 404 for another user's private image", async () => {
    const key = await upload(alice, 'vision');
    expect((await downloadUrl(bob, key)).status).toBe(404);
  });

  it('lets the owner get a link to their private image', async () => {
    const key = await upload(alice, 'vision');
    const res = await downloadUrl(alice, key);
    expect(res.status).toBe(200);
  });

  it('keeps public post images readable by others', async () => {
    const key = await upload(alice, 'post');
    expect((await downloadUrl(bob, key)).status).toBe(200);
  });

  it.each([
    (a: string) =>
      `vision/${a}/../other/3f2c9a1e-7b4d-4c2a-9e1f-0a1b2c3d4e5f.jpg`,
    () => 'vision%2Fother%2F3f2c9a1e-7b4d-4c2a-9e1f-0a1b2c3d4e5f.jpg',
    () => 'vision//3f2c9a1e-7b4d-4c2a-9e1f-0a1b2c3d4e5f.jpg',
    () => '3f2c9a1e-7b4d-4c2a-9e1f-0a1b2c3d4e5f.jpg',
  ])('rejects crafted key #%#', async (make) => {
    const res = await downloadUrl(bob, make(bob.id));
    expect(res.status).toBe(404);
  });
});
