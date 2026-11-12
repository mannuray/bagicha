import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ServiceUnavailableError } from '../errors';
import { HealthReport, HealthService } from './health.service';

/** Readiness (`/health`) and liveness (`/health/live`) probes. Unauthenticated. */
@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  async readiness(): Promise<HealthReport> {
    const report = await this.health.check();
    if (report.status !== 'ok') {
      throw new ServiceUnavailableError(
        'HEALTH_CHECK_FAILED',
        'A dependency is unavailable',
        { ...report },
      );
    }
    return report;
  }

  @Get('live')
  liveness(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
