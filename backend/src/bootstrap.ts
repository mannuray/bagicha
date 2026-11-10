import { INestApplication } from '@nestjs/common';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { MonitorService, MonitorValidationPipe } from './common/monitor';
import { Logger } from 'nestjs-pino';

/** Global app wiring shared by main.ts and the e2e harness. */
export function configureApp(app: INestApplication): INestApplication {
  const logger = app.get(Logger);
  app.useLogger(logger);
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter(logger));

  app.useGlobalPipes(
    new MonitorValidationPipe(app.get(MonitorService), {
      whitelist: true,
      transform: true,
      errorHttpStatusCode: 422,
    }),
  );

  app.setGlobalPrefix('api/v1');
  return app;
}
