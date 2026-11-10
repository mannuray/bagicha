import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

export type CheckStatus = 'up' | 'down';
export interface HealthReport {
  status: 'ok' | 'error';
  checks: Record<'database' | 'redis', { status: CheckStatus; error?: string }>;
}

const CHECK_TIMEOUT_MS = 2000;

async function withTimeout<T>(work: Promise<T>): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('timed out')), CHECK_TIMEOUT_MS);
  });
  try {
    return await Promise.race([work, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async check(): Promise<HealthReport> {
    const [database, redis] = await Promise.all([
      this.probe(() => this.prisma.$queryRaw`SELECT 1`),
      this.probe(() => this.redis.ping()),
    ]);
    const healthy = database.status === 'up' && redis.status === 'up';
    return { status: healthy ? 'ok' : 'error', checks: { database, redis } };
  }

  private async probe(
    run: () => Promise<unknown>,
  ): Promise<{ status: CheckStatus; error?: string }> {
    try {
      await withTimeout(run());
      return { status: 'up' };
    } catch (err) {
      return { status: 'down', error: (err as Error).message };
    }
  }
}
