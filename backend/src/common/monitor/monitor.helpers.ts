import { ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable, from, of, lastValueFrom } from 'rxjs';
import { randomUUID } from 'crypto';
import { MonitorContext } from './monitor.context';
import { MonitorService } from './monitor.service';
import type { MonitorEvent } from './monitor.types';

/**
 * Drop-in for `AuthGuard('jwt')` that emits an `auth` event with duration
 * and success/failure. Use it via `@UseGuards(MonitorJwtAuthGuard)` instead of
 * `@UseGuards(AuthGuard('jwt'))` on routes you want auth-step visibility for.
 */
@Injectable()
export class MonitorJwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    @Inject(MonitorService) private readonly monitor: MonitorService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const start = Date.now();
    let status: 'ok' | 'error' = 'ok';
    let errorType: string | undefined;
    try {
      const result = super.canActivate(context);
      const resolved =
        result instanceof Observable
          ? await lastValueFrom(result)
          : await Promise.resolve(result);
      if (!resolved) {
        status = 'error';
        errorType = 'AuthRejected';
      }
      return Boolean(resolved);
    } catch (error) {
      status = 'error';
      errorType = error instanceof Error ? error.constructor.name : 'AuthError';
      throw error;
    } finally {
      const ctx = MonitorContext.get();
      const now = Date.now();
      const event: MonitorEvent = {
        time: new Date(now).toISOString(),
        service: this.monitor.serviceName,
        environment: this.monitor.environment,
        trace_id: ctx?.trace_id ?? `auth-${randomUUID()}`,
        log_type: ctx ? 'request' : 'system',
        flow_step: 'auth',
        msg: status === 'ok' ? 'auth ok' : 'auth failed',
        duration_ms: now - start,
        ...(ctx?.request_id ? { request_id: ctx.request_id } : {}),
        ...(ctx?.span_id ? { parent_span_id: ctx.span_id } : {}),
        ...(ctx?.method ? { method: ctx.method } : {}),
        ...(ctx?.route ? { route: ctx.route } : {}),
        ...(errorType ? { error_type: errorType } : {}),
        attributes: {
          mechanism: 'jwt',
          status,
        },
      };
      this.monitor.emit(event);
    }
    // unreachable but satisfies the type system if we ever reorder
    return of(false) as unknown as boolean;
  }
}

/**
 * Wraps a fetch call to emit an `external` step event with target host,
 * method, status, duration. Drop-in for `fetch(url, init)`. Never captures
 * request or response bodies.
 */
export async function wrapFetch(
  monitor: MonitorService,
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const start = Date.now();
  let status: 'ok' | 'error' = 'ok';
  let statusCode: number | undefined;
  let errorType: string | undefined;
  try {
    const response = await fetch(url, init);
    statusCode = response.status;
    if (!response.ok) status = 'error';
    return response;
  } catch (error) {
    status = 'error';
    errorType = error instanceof Error ? error.constructor.name : 'FetchError';
    throw error;
  } finally {
    const ctx = MonitorContext.get();
    const now = Date.now();
    const target = safeHost(url);
    const event: MonitorEvent = {
      time: new Date(now).toISOString(),
      service: monitor.serviceName,
      environment: monitor.environment,
      trace_id: ctx?.trace_id ?? `external-${randomUUID()}`,
      log_type: ctx ? 'request' : 'system',
      flow_step: 'external',
      msg:
        status === 'ok' ? `external ${target} ok` : `external ${target} failed`,
      duration_ms: now - start,
      ...(ctx?.request_id ? { request_id: ctx.request_id } : {}),
      ...(ctx?.span_id ? { parent_span_id: ctx.span_id } : {}),
      ...(ctx?.method ? { method: ctx.method } : {}),
      ...(ctx?.route ? { route: ctx.route } : {}),
      ...(typeof statusCode === 'number' ? { status_code: statusCode } : {}),
      ...(errorType ? { error_type: errorType } : {}),
      attributes: {
        target_host: target,
        outbound_method: (init?.method ?? 'GET').toUpperCase(),
        status,
      },
    };
    monitor.emit(event);
  }
}

function safeHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return 'unknown';
  }
}

// kept to silence unused-import lint when not all of these helpers are used
void from;
