import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Plant, PrismaClient, User } from '@prisma/client';
import { randomUUID } from 'crypto';

/** Empties every application table (keeps migration history). */
export async function resetDb(prisma: PrismaClient): Promise<void> {
  const tables = await prisma.$queryRawUnsafe<Array<{ tablename: string }>>(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`,
  );
  if (tables.length === 0) return;
  const list = tables.map((t) => `"public"."${t.tablename}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} CASCADE`);
}

export async function seedUser(
  prisma: PrismaClient,
  overrides: Partial<User> = {},
): Promise<User> {
  return prisma.user.create({
    data: {
      phone_number: `+91${Math.floor(6000000000 + Math.random() * 3999999999)}`,
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
  return app
    .get(JwtService)
    .sign({ sub: user.id, phoneNumber: user.phone_number });
}
