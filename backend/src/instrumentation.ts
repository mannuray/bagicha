/**
 * OpenTelemetry bootstrap. Loaded with `node --require ./dist/instrumentation.js`
 * BEFORE main.js — importing it from main.ts would start instrumentation after
 * the libraries it patches are already loaded, silently breaking tracing.
 */
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK, tracing } from '@opentelemetry/sdk-node';
import { registerOtelSdk } from './common/observability/otel-handle';
import {
  redactIncomingHttpSpan,
  redisStatement,
} from './common/observability/span-redaction';

const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

if (!endpoint) {
  // Local dev: keep spans/metrics in-process, never try to reach a collector.
  process.env.OTEL_METRICS_EXPORTER ??= 'none';
  process.env.OTEL_LOGS_EXPORTER ??= 'none';
}

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    'service.name': process.env.OTEL_SERVICE_NAME ?? 'bagicha-backend',
    'deployment.environment': process.env.NODE_ENV ?? 'development',
  }),
  // Without a collector, still record spans (real trace ids in logs) but export nowhere.
  ...(endpoint
    ? { traceExporter: new OTLPTraceExporter() }
    : { spanProcessors: [new tracing.NoopSpanProcessor()] }),
  metricReader: endpoint
    ? new PeriodicExportingMetricReader({ exporter: new OTLPMetricExporter() })
    : undefined,
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': { enabled: false },
      // Spans follow the logging rules (span-redaction.ts).
      '@opentelemetry/instrumentation-ioredis': {
        dbStatementSerializer: redisStatement,
      },
      '@opentelemetry/instrumentation-http': {
        requestHook: (span, request) => {
          if ('url' in request) redactIncomingHttpSpan(span, request);
        },
      },
    }),
  ],
});

sdk.start();
// No signal handlers here: Nest owns SIGTERM and flushes the SDK via OtelShutdownHook
// after requests drain and connections close.
registerOtelSdk(sdk);
