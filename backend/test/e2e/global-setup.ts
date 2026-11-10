import { execSync } from 'child_process';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';
import { loadTestEnv } from './load-env';

/** Creates the test database if missing and applies every migration to it. */
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
}
