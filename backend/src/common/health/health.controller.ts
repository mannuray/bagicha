import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
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

  /**
   * TEMPORARY (remove after reading it once on Render): shows the caller its own
   * forwarding headers, to count the proxy hops for the trust proxy setting.
   * Echoes only the caller's own request; logs nothing.
   */
  @Get('proxy-hops')
  proxyHops(@Req() req: Request) {
    const header = (name: string) => req.headers[name] ?? null;
    return {
      req_ip: req.ip,
      ips: req.ips,
      x_forwarded_for: header('x-forwarded-for'),
      true_client_ip: header('true-client-ip'),
      cf_connecting_ip: header('cf-connecting-ip'),
      x_real_ip: header('x-real-ip'),
      socket: req.socket.remoteAddress ?? null,
    };
  }
}
