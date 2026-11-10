import {
  ArgumentMetadata,
  Inject,
  Injectable,
  ValidationPipe,
} from '@nestjs/common';
import type { ValidationPipeOptions } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { MonitorContext } from './monitor.context';
import { MonitorService } from './monitor.service';
import type { MonitorEvent } from './monitor.types';

/**
 * Drop-in replacement for NestJS ValidationPipe that emits a `validation`
 * event per pipe execution. Captures duration and pass/fail only — never the
 * incoming body or specific field values.
 */
@Injectable()
export class MonitorValidationPipe extends ValidationPipe {
  constructor(
    @Inject(MonitorService) private readonly monitor: MonitorService,
    options?: ValidationPipeOptions,
  ) {
    super(options);
  }

  async transform(
    value: unknown,
    metadata: ArgumentMetadata,
  ): Promise<unknown> {
    const start = Date.now();
    let status: 'ok' | 'error' = 'ok';
    let errorType: string | undefined;
    try {
      return await super.transform(value, metadata);
    } catch (error) {
      status = 'error';
      errorType =
        error instanceof Error ? error.constructor.name : 'ValidationError';
      throw error;
    } finally {
      const ctx = MonitorContext.get();
      const now = Date.now();
      const event: MonitorEvent = {
        time: new Date(now).toISOString(),
        service: this.monitor.serviceName,
        environment: this.monitor.environment,
        trace_id: ctx?.trace_id ?? `validation-${randomUUID()}`,
        log_type: ctx ? 'request' : 'system',
        flow_step: 'validation',
        msg:
          status === 'ok'
            ? `validation ${metadata.type} ok`
            : `validation ${metadata.type} failed`,
        duration_ms: now - start,
        ...(ctx?.request_id ? { request_id: ctx.request_id } : {}),
        ...(ctx?.span_id ? { parent_span_id: ctx.span_id } : {}),
        ...(ctx?.method ? { method: ctx.method } : {}),
        ...(ctx?.route ? { route: ctx.route } : {}),
        ...(errorType ? { error_type: errorType } : {}),
        attributes: {
          arg_type: metadata.type,
          status,
        },
      };
      this.monitor.emit(event);
    }
  }
}
