import type { PrismaService } from '../../prisma/prisma.service';
import { CatalogueRepository } from './catalogue.repository';

describe('CatalogueRepository.applyPush', () => {
  it('gives the push transaction room for a slow link to the database', async () => {
    const options: unknown[] = [];
    const tx = {
      catalogueMeta: { upsert: jest.fn(() => Promise.resolve({ version: 1 })) },
    };
    const prisma = {
      $transaction: jest.fn((fn: (t: typeof tx) => unknown, opts: unknown) => {
        options.push(opts);
        return fn(tx);
      }),
    };
    const repo = new CatalogueRepository(prisma as unknown as PrismaService);
    await repo.applyPush({ crops: [], methods: [], careSteps: [] });
    // Prisma's default is 5 s: ~65 upserts from a laptop to Neon can take longer.
    expect(options[0]).toEqual({ timeout: 60_000, maxWait: 10_000 });
  });
});
