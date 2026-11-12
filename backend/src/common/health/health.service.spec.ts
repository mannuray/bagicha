import { HealthService } from './health.service';

describe('HealthService', () => {
  it('reports a dependency as down without its error text (the probe is unauthenticated)', async () => {
    const prisma = {
      $queryRaw: jest.fn(() =>
        Promise.reject(new Error('connect postgresql://app:hunter2@db failed')),
      ),
    };
    const redis = { ping: jest.fn(() => Promise.resolve('PONG')) };
    const report = await new HealthService(
      prisma as never,
      redis as never,
    ).check();
    expect(report).toEqual({
      status: 'error',
      checks: { database: { status: 'down' }, redis: { status: 'up' } },
    });
    expect(JSON.stringify(report)).not.toContain('hunter2');
  });
});
