import type { PrismaService } from '../../prisma/prisma.service';
import { WeatherAudienceRepository } from './weather-audience.repository';

function build() {
  const findMany = jest.fn((_args: unknown) => Promise.resolve([]));
  const repo = new WeatherAudienceRepository({
    user: { findMany },
  } as unknown as PrismaService);
  return { repo, findMany };
}

describe('WeatherAudienceRepository.batch', () => {
  it('pages by id greater than the last one seen, so a user who leaves mid-run never ends or shifts the run', async () => {
    const { repo, findMany } = build();
    await repo.batch('u-200', 200);
    const args = findMany.mock.calls[0][0] as Record<string, unknown>;
    expect(args).not.toHaveProperty('cursor');
    expect(args).not.toHaveProperty('skip');
    expect(args).toMatchObject({
      where: { id: { gt: 'u-200' }, plants: { some: { ended_at: null } } },
      orderBy: { id: 'asc' },
      take: 200,
    });
  });

  it('starts from the beginning without a last id', async () => {
    const { repo, findMany } = build();
    await repo.batch(null, 50);
    const args = findMany.mock.calls[0][0] as {
      where: Record<string, unknown>;
    };
    expect(args.where).not.toHaveProperty('id');
  });
});
