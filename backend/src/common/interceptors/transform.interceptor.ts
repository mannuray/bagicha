import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

export interface Response<T> {
  success: boolean;
  data: T;
  pagination?: any;
  request_id: string;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const request = context.switchToHttp().getRequest();
    const requestId = request.headers['x-request-id'] || uuidv4();

    return next.handle().pipe(
      map((result) => {
        // Handle paginated results specifically
        if (result && result.items && result.pagination) {
          return {
            success: true,
            data: result.items,
            pagination: result.pagination,
            request_id: requestId,
            timestamp: new Date().toISOString(),
          };
        }

        return {
          success: true,
          data: result,
          request_id: requestId,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
