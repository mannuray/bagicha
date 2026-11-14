/**
 * The catalogue push, run by the owner like a migration (docs/deploy.md):
 *   docker build --target catalogue-push -t bagicha-catalogue-push .
 *   docker run --rm ... -e DATABASE_URL=... bagicha-catalogue-push
 * Locally: npm run catalogue:push. Needs only DATABASE_URL, so it builds the
 * push over a plain Prisma client rather than booting the whole API.
 */
import { PrismaClient } from '@prisma/client';
import pino from 'pino';
import type { PrismaService } from '../../../prisma/prisma.service';
import { CatalogueRepository } from '../catalogue.repository';
import { CATALOGUE_SEED } from '../seed';
import {
  CataloguePushService,
  type ItemOutcome,
} from './catalogue-push.service';

const logger = pino({ base: { service: 'bagicha-catalogue-push' } });
const changed = (items: ItemOutcome[]) =>
  items.filter((i) => i.outcome !== 'unchanged');

async function main(): Promise<void> {
  const client = new PrismaClient();
  try {
    // The repository only uses the Prisma client API; PrismaService adds query monitoring.
    const repo = new CatalogueRepository(client as unknown as PrismaService);
    const report = await new CataloguePushService(repo).push(CATALOGUE_SEED);
    const { version, ...kinds } = report;
    const all = Object.values(kinds).flat();
    logger.info(
      {
        version,
        ...Object.fromEntries(
          Object.entries(kinds).map(([kind, items]) => [kind, changed(items)]),
        ),
        unchanged: all.length - changed(all).length,
      },
      'Catalogue pushed',
    );
  } finally {
    await client.$disconnect();
  }
}

main().catch((error: unknown) => {
  logger.error({ err: error }, 'Catalogue push failed; nothing was written');
  process.exit(1);
});
