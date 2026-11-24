import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { RATE_LIMIT_BACKEND } from '../../src/common/rate-limit/fail-open.storage';
import { createTestApp } from './app';
import { User } from '@prisma/client';
import { PrismaService } from '../../src/prisma/prisma.service';
import { clearRateLimitKeys, seedUser, tokenFor } from './fixtures';

// A fresh phone per request: one phone also has its own one-a-minute cooldown.
let seq = 0;

describe('rate limiting', () => {
  describe('with Redis available', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await createTestApp();
    });
    beforeEach(clearRateLimitKeys);
    afterAll(async () => {
      await clearRateLimitKeys();
      await app.close();
    });

    it('counts each visitor separately behind Render, and a faked X-Forwarded-For changes nothing', async () => {
      await clearRateLimitKeys();
      // Render's real chain (measured): visitor -> Cloudflare -> Render's load
      // balancer -> a local proxy -> app, so X-Forwarded-For arrives as
      // "<anything the client sent>, <visitor>, <cloudflare>, <load balancer>"
      // and the edge/balancer addresses vary per request.
      let n = 0;
      const ask = (visitor: string, faked?: string) => {
        n += 1;
        const chain = [visitor, `172.71.198.${n}`, `10.29.117.${n}`];
        if (faked) chain.unshift(faked);
        return request(app.getHttpServer())
          .post('/api/v1/auth/request-otp')
          .set('X-Forwarded-For', chain.join(', '))
          .send({ phone_number: `+9190000${String(++seq).padStart(5, '0')}` });
      };
      for (let i = 0; i < 5; i += 1)
        await ask('152.59.155.164', `198.51.100.${i}`);
      expect((await ask('152.59.155.164', '198.51.100.99')).status).toBe(429);
      expect((await ask('152.59.155.200')).status).not.toBe(429);
    });

    it('rejects the 6th OTP request in a minute with RATE_LIMITED', async () => {
      const send = () =>
        request(app.getHttpServer())
          .post('/api/v1/auth/request-otp')
          .send({ phone_number: `+9199999${String(++seq).padStart(5, '0')}` });
      for (let i = 0; i < 5; i++) {
        expect((await send()).status).toBe(200);
      }
      const blocked = await send();
      expect(blocked.status).toBe(429);
      expect(blocked.body.error.code).toBe('RATE_LIMITED');
      expect(blocked.body.error.details).toEqual({ bucket: 'auth' });
    });

    it('counts OTP requests per IP even when a valid sign-in token is sent', async () => {
      const prisma = app.get(PrismaService);
      const token = `Bearer ${tokenFor(app, await seedUser(prisma))}`;
      const send = (auth?: string) => {
        const r = request(app.getHttpServer()).post('/api/v1/auth/request-otp');
        if (auth) void r.set('Authorization', auth);
        return r.send({
          phone_number: `+9198888${String(++seq).padStart(5, '0')}`,
        });
      };
      for (let i = 0; i < 5; i++) expect((await send()).status).toBe(200);
      expect((await send(token)).status).toBe(429);
    });

    it('caps community and chat writes at 30 a minute per user, shared across routes', async () => {
      const prisma = app.get(PrismaService);
      const [writer, other] = [await seedUser(prisma), await seedUser(prisma)];
      const as = (user: User) => `Bearer ${tokenFor(app, user)}`;
      for (let i = 0; i < 20; i++) {
        const res = await request(app.getHttpServer())
          .post('/api/v1/community/posts')
          .set('Authorization', as(writer))
          .send({ content: `post ${i}` });
        expect(res.status).not.toBe(429);
      }
      for (let i = 0; i < 10; i++) {
        const res = await request(app.getHttpServer())
          .post('/api/v1/chat/messages')
          .set('Authorization', as(writer))
          .send({ receiver_id: other.id, content: `hi ${i}` });
        expect(res.status).not.toBe(429);
      }
      const blocked = await request(app.getHttpServer())
        .post('/api/v1/community/posts')
        .set('Authorization', as(writer))
        .send({ content: 'one too many' });
      expect(blocked.status).toBe(429);
      expect(blocked.body.error.details).toEqual({ bucket: 'write' });
      // Another user from the same address is not affected.
      const fresh = await request(app.getHttpServer())
        .post('/api/v1/community/posts')
        .set('Authorization', as(other))
        .send({ content: 'mine' });
      expect(fresh.status).not.toBe(429);
    });
  });

  describe('when the rate-limit store is down', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await createTestApp((b) =>
        b.overrideProvider(RATE_LIMIT_BACKEND).useValue({
          increment: () => Promise.reject(new Error('ECONNREFUSED')),
        }),
      );
    });
    afterAll(async () => {
      await app.close();
    });

    it('fails open: requests still go through', async () => {
      for (let i = 0; i < 7; i++) {
        const res = await request(app.getHttpServer())
          .post('/api/v1/auth/request-otp')
          .send({ phone_number: `+9198888${String(++seq).padStart(5, '0')}` });
        expect(res.status).toBe(200);
      }
    });

    it('still fails closed on OTP verification without a stored code', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/verify-otp')
        .send({ phone_number: '+919999900003', otp: '000000' });
      expect(res.status).toBe(401);
    });
  });
});
