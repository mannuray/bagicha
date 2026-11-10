import { metrics } from '@opentelemetry/api';
import {
  AggregationTemporality,
  InMemoryMetricExporter,
  MeterProvider,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';
import { Metrics } from './metrics';

describe('Metrics', () => {
  const exporter = new InMemoryMetricExporter(
    AggregationTemporality.CUMULATIVE,
  );
  const reader = new PeriodicExportingMetricReader({
    exporter,
    exportIntervalMillis: 60_000,
  });

  beforeAll(() => {
    metrics.setGlobalMeterProvider(new MeterProvider({ readers: [reader] }));
  });

  afterAll(async () => {
    await reader.shutdown();
    metrics.disable();
  });

  async function collect(name: string) {
    const { resourceMetrics } = await reader.collect();
    return resourceMetrics.scopeMetrics
      .flatMap((s) => s.metrics)
      .find((m) => m.descriptor.name === name);
  }

  it('counts AI calls by feature and outcome', async () => {
    const m = new Metrics();
    m.aiCall('diagnose', 'ok');
    m.aiCall('diagnose', 'ok');
    m.aiCall('ask_ai', 'invalid_response');
    const metric = await collect('bagicha.ai.calls');
    const points = metric?.dataPoints ?? [];
    const ok = points.find(
      (p) =>
        p.attributes.feature === 'diagnose' && p.attributes.outcome === 'ok',
    );
    expect(ok?.value).toBe(2);
  });

  it('counts tasks created by source with a count', async () => {
    const m = new Metrics();
    m.taskCreated('SEASONAL_PACK', 3);
    const metric = await collect('bagicha.tasks.created');
    const point = metric?.dataPoints.find(
      (p) => p.attributes.source === 'SEASONAL_PACK',
    );
    expect(point?.value).toBe(3);
  });

  it('reports queue depth through an observable gauge', async () => {
    const m = new Metrics();
    m.registerQueueDepth('task-generation', () => Promise.resolve(7));
    const metric = await collect('bagicha.queue.depth');
    const point = metric?.dataPoints.find(
      (p) => p.attributes.queue === 'task-generation',
    );
    expect(point?.value).toBe(7);
  });
});
