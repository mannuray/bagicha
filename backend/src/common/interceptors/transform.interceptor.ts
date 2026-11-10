import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request } from 'express';
import { map, Observable } from 'rxjs';
import { PageMeta } from '../pagination';

export interface SuccessEnvelope<T> {
  success: true;
  data: T;
  pagination?: PageMeta;
  request_id: string;
  timestamp: string;
}

function isPage(
  value: unknown,
): value is { items: unknown; pagination: PageMeta } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'items' in value &&
    'pagination' in value &&
    Boolean((value as { items: unknown; pagination: unknown }).pagination)
  );
}

/** Wraps every successful response in the shared envelope; pages become data + pagination. */
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessEnvelope<unknown>> {
    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers['x-request-id'];
    const requestId =
      (Array.isArray(header) ? header[0] : header) ?? randomUUID();

    return next.handle().pipe(
      map((result: unknown) => {
        const timestamp = new Date().toISOString();
        if (isPage(result)) {
          return {
            success: true as const,
            data: result.items,
            pagination: result.pagination,
            request_id: requestId,
            timestamp,
          };
        }
        return {
          success: true as const,
          data: result,
          request_id: requestId,
          timestamp,
        };
      }),
    );
  }
}
