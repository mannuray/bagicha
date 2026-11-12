import { Prisma } from '@prisma/client';
import { MonitorContext } from './monitor.context';
import { MonitorService } from './monitor.service';
import type { MonitorEvent } from './monitor.types';

/**
 * Returns a query-event listener for Prisma 6 that emits one `db` event per
 * executed query.
 *
 * - Captures: target (table name), duration, status (ok), trace/request context
 *   when active.
 * - Never captures: SQL `query` text or `params` (PII risk).
 *
 * Wire it from PrismaService:
 *
 *   constructor(private monitor: MonitorService) {
 *     super({ log: [{ emit: 'event', level: 'query' },
 *                    { emit: 'event', level: 'error' }] });
 *   }
 *   onModuleInit() {
 *     this.$on('query', monitorPrismaQueryListener(this.monitor));
 *     this.$on('error', monitorPrismaErrorListener(this.monitor));
 *   }
 */
// NOTE on context propagation:
// Prisma 6's $on('query') listener fires outside the originating request's
// AsyncLocalStorage context (the engine emits events from internal IPC, not
// from the caller's async task chain). As a result, MonitorContext.get() is
// often undefined here even though the query was triggered by a real
// request. To avoid polluting kathawachak with orphaned / synthetically-traced
// flows, we only emit when we DO have an active context. Full per-query
// attribution requires switching to Prisma client extensions ($extends with
// query.$allOperations), which is a bigger refactor tracked separately.

export function monitorPrismaQueryListener(monitor: MonitorService) {
  return (event: Prisma.QueryEvent) => {
    const ctx = MonitorContext.get();
    if (!ctx) return;
    const time = new Date(event.timestamp).toISOString();
    const target = event.target ?? 'prisma';
    const out: MonitorEvent = {
      time,
      service: monitor.serviceName,
      environment: monitor.environment,
      trace_id: ctx.trace_id,
      request_id: ctx.request_id,
      log_type: 'request',
      flow_step: 'db',
      msg: `prisma ${target} ok`,
      duration_ms: event.duration,
      ...(ctx.span_id ? { parent_span_id: ctx.span_id } : {}),
      ...(ctx.method ? { method: ctx.method } : {}),
      ...(ctx.route ? { route: ctx.route } : {}),
      attributes: {
        prisma_target: target,
        status: 'ok',
      },
    };
    monitor.emit(out);
  };
}

export function monitorPrismaErrorListener(monitor: MonitorService) {
  return (event: Prisma.LogEvent) => {
    const ctx = MonitorContext.get();
    if (!ctx) return;
    const time = new Date(event.timestamp).toISOString();
    const out: MonitorEvent = {
      time,
      service: monitor.serviceName,
      environment: monitor.environment,
      trace_id: ctx.trace_id,
      request_id: ctx.request_id,
      log_type: 'request',
      flow_step: 'db',
      // Fixed text: a driver message can carry the connection string or values.
      msg: 'prisma error',
      ...(ctx.span_id ? { parent_span_id: ctx.span_id } : {}),
      ...(ctx.method ? { method: ctx.method } : {}),
      ...(ctx.route ? { route: ctx.route } : {}),
      error_type: 'PrismaError',
      attributes: {
        prisma_target: event.target ?? 'prisma',
        status: 'error',
      },
    };
    monitor.emit(out);
  };
}
