import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { MonitorContext } from './monitor.context';
import { MonitorService } from './monitor.service';
import type { MonitorRequestContext } from './monitor.types';

const TRACE_HEADER = 'x-trace-id';
const REQUEST_HEADER = 'x-request-id';
const PARENT_SPAN_HEADER = 'x-span-id';

function firstHeader(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

@Injectable()
export class MonitorMiddleware implements NestMiddleware {
  constructor(private readonly monitorService: MonitorService) {}

  use(req: Request, _res: Response, next: NextFunction): void {
    const traceId = firstHeader(req.headers[TRACE_HEADER]) ?? uuidv4();
    const requestId = firstHeader(req.headers[REQUEST_HEADER]) ?? uuidv4();
    const parentSpanId = firstHeader(req.headers[PARENT_SPAN_HEADER]);

    // Make the request_id visible to downstream interceptors/filters so the
    // response envelope and exception filter can reuse it instead of minting
    // their own.
    req.headers[REQUEST_HEADER] = requestId;
    req.headers[TRACE_HEADER] = traceId;

    const ctx: MonitorRequestContext = {
      trace_id: traceId,
      request_id: requestId,
      service: this.monitorService.serviceName,
      environment: this.monitorService.environment,
      raw_path: req.originalUrl ?? req.url,
      method: req.method,
      span_id: uuidv4(),
      start_time_ms: Date.now(),
      ...(parentSpanId ? { parent_span_id: parentSpanId } : {}),
    };

    MonitorContext.run(ctx, () => next());
  }
}
