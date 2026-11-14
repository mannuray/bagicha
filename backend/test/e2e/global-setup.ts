import { execSync } from 'child_process';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';
import { CATALOGUE_SEED } from '../../src/modules/catalogue';
import { CatalogueRepository } from '../../src/modules/catalogue/catalogue.repository';
import type { PrismaService } from '../../src/prisma/prisma.service';
import { loadTestEnv } from './load-env';

/** Creates the test database if missing, applies every migration and fills the plant catalogue. */
export default async function globalSetup(): Promise<void> {
  loadTestEnv();
  const testUrl = new URL(process.env.DATABASE_URL as string);
  const dbName = testUrl.pathname.replace(/^\//, '');
  const adminUrl = new URL(testUrl.toString());
  adminUrl.pathname = '/postgres';

  const admin = new PrismaClient({
    datasources: { db: { url: adminUrl.toString() } },
  });
  try {
    const rows = await admin.$queryRawUnsafe<Array<{ exists: boolean }>>(
      `SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = '${dbName}') AS "exists"`,
    );
    if (!rows[0]?.exists) {
      await admin.$executeRawUnsafe(`CREATE DATABASE "${dbName}"`);
    }
  } finally {
    await admin.$disconnect();
  }

  execSync('npx prisma migrate deploy', {
    cwd: resolve(__dirname, '../..'),
    env: { ...process.env },
    stdio: 'pipe',
  });

  // The API refuses to start without an approved catalogue.
  const client = new PrismaClient();
  try {
    const repo = new CatalogueRepository(client as unknown as PrismaService);
    await repo.applyPush({
      crops: CATALOGUE_SEED.crops.map((c, sort_order) => ({
        ...c,
        sort_order,
      })),
      methods: CATALOGUE_SEED.methods,
      careSteps: CATALOGUE_SEED.careSteps,
    });
  } finally {
    await client.$disconnect();
  }
}
