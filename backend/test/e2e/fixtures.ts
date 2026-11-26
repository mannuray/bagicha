import sharp from 'sharp';
import Redis from 'ioredis';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Plant, PrismaClient, User } from '@prisma/client';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { fakeGoogleToken } from './fake-google';

/** Empties every application table (keeps migration history). */
export async function resetDb(prisma: PrismaClient): Promise<void> {
  const tables = await prisma.$queryRawUnsafe<Array<{ tablename: string }>>(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations' AND tablename NOT LIKE 'catalogue\\_%'`,
  );
  if (tables.length === 0) return;
  const list = tables.map((t) => `"public"."${t.tablename}"`).join(', ');
  // A background job from the previous test (e.g. task generation) can still be
  // writing; TRUNCATE then deadlocks (40P01). Retry briefly instead of failing.
  for (let attempt = 1; ; attempt += 1) {
    try {
      // The audit log refuses TRUNCATE (append-only); only a test reset may wipe it.
      await prisma.$transaction([
        prisma.$executeRawUnsafe(
          'ALTER TABLE "audit_events" DISABLE TRIGGER audit_events_no_truncate',
        ),
        prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} CASCADE`),
        prisma.$executeRawUnsafe(
          'ALTER TABLE "audit_events" ENABLE TRIGGER audit_events_no_truncate',
        ),
      ]);
      return;
    } catch (err) {
      const deadlock = String((err as { message?: string }).message).includes(
        '40P01',
      );
      if (!deadlock || attempt >= 5) throw err;
      await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
    }
  }
}

export async function seedUser(
  prisma: PrismaClient,
  overrides: Partial<User> = {},
): Promise<User> {
  return prisma.user.create({
    data: {
      google_sub: `sub-${randomUUID()}`,
      email: `gardener-${randomUUID()}@example.test`,
      name: 'Test Gardener',
      district: 'Patna',
      ...overrides,
    } as User,
  });
}

export async function seedPlant(
  prisma: PrismaClient,
  userId: string,
  overrides: Partial<Plant> = {},
): Promise<Plant> {
  return prisma.plant.create({
    data: {
      user_id: userId,
      name: `Aam ${randomUUID().slice(0, 6)}`,
      species: 'Mango',
      species_family: 'mango',
      ...overrides,
    } as Plant,
  });
}

export function tokenFor(app: INestApplication, user: User): string {
  return app.get(JwtService).sign({ sub: user.id });
}

/**
 * Clears rate-limit counters: every e2e file shares one IP and one Redis.
 */
export async function clearRateLimitKeys(): Promise<void> {
  const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  });
  const keys = await redis.keys('{rl:*');
  if (keys.length) await redis.del(...keys);
  redis.disconnect();
}

/** A real 2×2 JPEG, base64: vision decodes photos before the AI sees them. */
export const TINY_JPEG_B64 =
  '/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAACAAIDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAB//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AJoAfi5//9k=';

/** A real PNG of random noise, about `bytes` long once encoded (noise doesn't compress). */
export async function noisePngBase64(bytes: number): Promise<string> {
  const side = Math.ceil(Math.sqrt(bytes / 3));
  const raw = Buffer.alloc(side * side * 3);
  for (let i = 0; i < raw.length; i++) raw[i] = Math.floor(Math.random() * 256);
  const png = await sharp(raw, {
    raw: { width: side, height: side, channels: 3 },
  })
    .png()
    .toBuffer();
  return png.toString('base64');
}

/** Signs a seeded user in through POST /auth/google with the fake Google. */
export function signInWithGoogle(app: INestApplication, user: User) {
  return request(app.getHttpServer())
    .post('/api/v1/auth/google')
    .send({ id_token: fakeGoogleToken(user.google_sub!, user.email!) });
}
