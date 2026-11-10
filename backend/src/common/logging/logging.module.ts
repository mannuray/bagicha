import {
  CallHandler,
  ExecutionContext,
  Global,
  Injectable,
  MiddlewareConsumer,
  Module,
  NestInterceptor,
  NestMiddleware,
  NestModule,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { isSpanContextValid, trace } from '@opentelemetry/api';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { LoggerModule } from 'nestjs-pino';
import pino, { LoggerOptions } from 'pino';
import { Observable } from 'rxjs';
import { RequestContext } from './request-context';

export interface LogIdentity {
  service: string;
  version: string;
  env: string;
}

/** Pino options with the fixed fields every log line must carry. */
export function buildPinoOptions(identity: LogIdentity): LoggerOptions {
  return {
    base: { ...identity },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ level: label }),
    },
    mixin() {
      const fields: Record<string, string> = {};
      const spanContext = trace.getActiveSpan()?.spanContext();
      if (spanContext && isSpanContextValid(spanContext)) {
        fields.traceId = spanContext.traceId;
        fields.spanId = spanContext.spanId;
      }
      const request = RequestContext.get();
      if (request) {
        fields.requestId = request.requestId;
        if (request.userId) fields.userId = request.userId;
      }
      return fields;
    },
  };
}

function readHeader(req: Request, name: string): string | undefined {
  const value = req.headers[name];
  return Array.isArray(value) ? value[0] : value;
}

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const requestId = readHeader(req, 'x-request-id') ?? randomUUID();
    RequestContext.run({ requestId }, () => next());
  }
}

/** Runs after guards, so the authenticated user is known by now. */
@Injectable()
export class RequestUserInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{ user?: { id?: string } }>();
    if (req?.user?.id) RequestContext.setUser(req.user.id);
    return next.handle();
  }
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { version } = require('../../../package.json') as { version: string };

@Global()
@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const env = config.get<string>('NODE_ENV', 'development');
        return {
          pinoHttp: {
            ...buildPinoOptions({ service: 'bagicha-backend', version, env }),
            level:
              config.get<string>('LOG_LEVEL') ??
              (env === 'test' ? 'warn' : 'info'),
            genReqId: (req) =>
              RequestContext.get()?.requestId ??
              readHeader(req as Request, 'x-request-id') ??
              randomUUID(),
            customProps: () => {
              const userId = RequestContext.get()?.userId;
              return userId ? { userId } : {};
            },
          },
        };
      },
    }),
  ],
  providers: [{ provide: APP_INTERCEPTOR, useClass: RequestUserInterceptor }],
})
export class LoggingModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
