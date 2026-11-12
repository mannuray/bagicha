import { INestApplication } from '@nestjs/common';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { MonitorService, MonitorValidationPipe } from './common/monitor';
import { Logger } from 'nestjs-pino';
import { applyBodyLimits } from './common/http/body-limits';
import { corsOptionsFor, parseWebOrigins } from './common/http/web-origins';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { requestIdMiddleware } from './common/http/request-id';

/** Global app wiring shared by main.ts and the e2e harness. */
export function configureApp(app: INestApplication): INestApplication {
  // First: one request id for everything after, returned in X-Request-ID.
  app.use(requestIdMiddleware);
  // Standard security headers (nosniff, frame denial, HSTS; no X-Powered-By).
  app.use(helmet());
  const cors = corsOptionsFor(
    parseWebOrigins(app.get(ConfigService).get<string>('WEB_ORIGINS')),
  );
  if (cors) app.enableCors(cors);
  applyBodyLimits(app);
  const logger = app.get(Logger);
  app.useLogger(logger);
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter(logger));

  app.useGlobalPipes(
    new MonitorValidationPipe(app.get(MonitorService), {
      whitelist: true,
      // Unknown fields are a client mistake: reject them rather than drop them silently.
      forbidNonWhitelisted: true,
      transform: true,
      errorHttpStatusCode: 422,
    }),
  );

  app.setGlobalPrefix('api/v1');
  return app;
}
