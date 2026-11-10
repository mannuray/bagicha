import { MiddlewareConsumer, Module, NestModule, Global } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { MonitorInterceptor } from './monitor.interceptor';
import { MonitorMiddleware } from './monitor.middleware';
import { MonitorService } from './monitor.service';
import { MonitorJwtAuthGuard } from './monitor.helpers';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    MonitorService,
    MonitorMiddleware,
    MonitorJwtAuthGuard,
    {
      provide: APP_INTERCEPTOR,
      useClass: MonitorInterceptor,
    },
  ],
  exports: [MonitorService, MonitorJwtAuthGuard],
})
export class MonitorModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(MonitorMiddleware).forRoutes('*');
  }
}
