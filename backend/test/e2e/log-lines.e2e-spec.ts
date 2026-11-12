import { INestApplication } from '@nestjs/common';
import { PrismaClient, User } from '@prisma/client';
import fs from 'fs';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from './app';
import { resetDb, seedPlant, seedUser, tokenFor } from './fixtures';

/** What actually reaches stdout, from the running app (not the serializers in isolation). */
describe('log lines from the running app', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let alice: User;
  let bob: User;
  const lines: Array<Record<string, unknown>> = [];
  const spies: jest.SpyInstance[] = [];
  const level = process.env.LOG_LEVEL;

  beforeAll(async () => {
    process.env.LOG_LEVEL = 'info';
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });
  beforeEach(async () => {
    await resetDb(prisma);
    alice = await seedUser(prisma);
    bob = await seedUser(prisma);
    lines.length = 0;
    // pino writes to the stdout file descriptor directly (sonic-boom), not via process.stdout.
    const collect = (chunk: unknown) => {
      for (const text of String(chunk).split('\n')) {
        try {
          if (text.trim())
            lines.push(JSON.parse(text) as Record<string, unknown>);
        } catch {
          // not a log line
        }
      }
    };
    const size = (data: unknown) =>
      typeof data === 'string'
        ? Buffer.byteLength(data)
        : (data as Buffer).length;
    const realWriteSync = fs.writeSync;
    const realWrite = fs.write;
    spies.push(
      jest.spyOn(fs, 'writeSync').mockImplementation(((
        fd: number,
        data: unknown,
        ...rest: unknown[]
      ) => {
        if (fd !== 1)
          return (realWriteSync as (...a: unknown[]) => number)(
            fd,
            data,
            ...rest,
          );
        collect(data);
        return size(data);
      }) as typeof fs.writeSync),
      jest.spyOn(fs, 'write').mockImplementation(((
        fd: number,
        data: unknown,
        ...rest: unknown[]
      ) => {
        if (fd !== 1)
          return (realWrite as (...a: unknown[]) => void)(fd, data, ...rest);
        collect(data);
        const cb = rest.find((r) => typeof r === 'function') as
          | ((e: null, n: number) => void)
          | undefined;
        cb?.(null, size(data));
      }) as typeof fs.write),
    );
  });
  afterEach(() => {
    spies.splice(0).forEach((s) => s.mockRestore());
  });
  afterAll(async () => {
    process.env.LOG_LEVEL = level;
    await app.close();
  });

  it('an error line has the error type, a fixed message and the route pattern; nothing logs the real URL', async () => {
    const theirs = await seedPlant(prisma, bob.id);
    await request(app.getHttpServer())
      .get(`/api/v1/ledger/plants/${theirs.id}?phone=9876543210`)
      .set('Authorization', `Bearer ${tokenFor(app, alice)}`);
    await new Promise((r) => setTimeout(r, 50));
    const failed = lines.find(
      (l) => l.message === 'request failed' && l.level === 'warn',
    );
    expect(failed).toMatchObject({
      reason: 'PLANT_NOT_FOUND',
      route: '/api/v1/ledger/plants/:id',
    });
    expect((failed?.err as Record<string, unknown>)?.type).toBe(
      'NotFoundError',
    );
    const access = lines.find(
      (l) => l.message === 'request completed' || (l.req && l.res),
    );
    expect(access).toMatchObject({ route: '/api/v1/ledger/plants/:id' });
    const all = JSON.stringify(lines);
    expect(all).not.toContain(theirs.id);
    expect(all).not.toContain('9876543210');
  });

  it('a body the parser refuses still gets a client error and a log line', async () => {
    const bad = await request(app.getHttpServer())
      .post('/api/v1/auth/request-otp')
      .set('Content-Type', 'application/json')
      .send('{"phone_number": ');
    expect(bad.status).toBe(400);
    const encoded = await request(app.getHttpServer())
      .post('/api/v1/auth/request-otp')
      .set('Content-Type', 'application/json')
      .set('Content-Encoding', 'rot13')
      .send('{}');
    expect(encoded.status).toBe(415);
    expect(encoded.body.error.code).toBe('UNSUPPORTED_MEDIA_TYPE');
    await new Promise((r) => setTimeout(r, 50));
    const reasons = lines
      .filter((l) => l.message === 'request failed')
      .map((l) => l.reason);
    expect(reasons).toEqual(
      expect.arrayContaining(['BAD_REQUEST', 'UNSUPPORTED_MEDIA_TYPE']),
    );
  });
});
