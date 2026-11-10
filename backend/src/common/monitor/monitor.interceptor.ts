import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';
import { MonitorContext } from './monitor.context';
import { MonitorService } from './monitor.service';
import type { MonitorEvent } from './monitor.types';

function resolveRoute(
  request: Request,
  context: ExecutionContext,
): string | undefined {
  const expressRoute = (request as Request & { route?: { path?: string } })
    .route?.path;
  if (expressRoute) return expressRoute;

  // Fall back to the controller path metadata when the handler hasn't been
  // matched (e.g. 404 or exception before the router resolved a route).
  const handler = context.getHandler();
  const controller = context.getClass();
  const controllerPath = Reflect.getMetadata('path', controller);
  const handlerPath = Reflect.getMetadata('path', handler);
  if (controllerPath !== undefined || handlerPath !== undefined) {
    const normalizedController = controllerPath ? `/${controllerPath}` : '';
    const normalizedHandler = handlerPath ? `/${handlerPath}` : '';
    return `${normalizedController}${normalizedHandler}`.replace(/\/+/g, '/');
  }
  return undefined;
}

@Injectable()
export class MonitorInterceptor implements NestInterceptor {
  constructor(private readonly monitorService: MonitorService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const ctx = MonitorContext.get();
    if (!ctx) {
      return next.handle();
    }

    const route = resolveRoute(request, context);
    if (route) {
      MonitorContext.update({ route });
    }

    this.emitEntry(ctx, request, route);

    return next.handle().pipe(
      tap({
        next: () => {
          this.emitTerminal(
            ctx,
            request,
            route,
            response.statusCode,
            'response',
          );
        },
        error: (error: unknown) => {
          const status =
            error instanceof HttpException ? error.getStatus() : 500;
          const errorType =
            error instanceof Error ? error.constructor.name : 'UnknownError';
          this.emitTerminal(ctx, request, route, status, 'error', errorType);
        },
      }),
    );
  }

  private emitEntry(
    ctx: ReturnType<typeof MonitorContext.get> & object,
    request: Request,
    route: string | undefined,
  ): void {
    const event: MonitorEvent = {
      time: new Date(ctx.start_time_ms).toISOString(),
      service: ctx.service,
      environment: ctx.environment,
      trace_id: ctx.trace_id,
      request_id: ctx.request_id,
      log_type: 'request',
      flow_step: 'entry',
      method: request.method,
      raw_path: ctx.raw_path ?? request.originalUrl,
      msg: `${request.method} ${route ?? request.originalUrl} started`,
      ...(ctx.span_id ? { span_id: ctx.span_id } : {}),
      ...(route ? { route } : {}),
      ...((ctx as { parent_span_id?: string }).parent_span_id
        ? {
            parent_span_id: (ctx as { parent_span_id?: string }).parent_span_id,
          }
        : {}),
    };
    this.monitorService.emit(event);
  }

  private emitTerminal(
    ctx: ReturnType<typeof MonitorContext.get> & object,
    request: Request,
    route: string | undefined,
    statusCode: number,
    flowStep: 'response' | 'error',
    errorType?: string,
  ): void {
    const now = Date.now();
    const event: MonitorEvent = {
      time: new Date(now).toISOString(),
      service: ctx.service,
      environment: ctx.environment,
      trace_id: ctx.trace_id,
      request_id: ctx.request_id,
      log_type: 'request',
      flow_step: flowStep,
      method: request.method,
      raw_path: ctx.raw_path ?? request.originalUrl,
      status_code: statusCode,
      duration_ms: now - ctx.start_time_ms,
      msg:
        flowStep === 'response'
          ? `${request.method} ${route ?? request.originalUrl} completed`
          : `${request.method} ${route ?? request.originalUrl} failed`,
      ...(ctx.span_id ? { span_id: ctx.span_id } : {}),
      ...(route ? { route } : {}),
      ...(errorType ? { error_type: errorType } : {}),
    };
    this.monitorService.emit(event);
  }
}
