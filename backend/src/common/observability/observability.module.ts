import { Global, Module } from '@nestjs/common';
import { Metrics } from './metrics';
import { OtelShutdownHook } from './otel-handle';

@Global()
@Module({
  providers: [Metrics, OtelShutdownHook],
  exports: [Metrics],
})
export class ObservabilityModule {}
