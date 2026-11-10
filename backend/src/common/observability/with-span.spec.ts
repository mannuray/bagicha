import { context, SpanStatusCode, trace } from '@opentelemetry/api';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { withSpan } from './with-span';

describe('withSpan', () => {
  const exporter = new InMemorySpanExporter();
  const contextManager = new AsyncLocalStorageContextManager();

  beforeAll(() => {
    context.setGlobalContextManager(contextManager.enable());
    trace.setGlobalTracerProvider(
      new BasicTracerProvider({
        spanProcessors: [new SimpleSpanProcessor(exporter)],
      }),
    );
  });

  afterEach(() => exporter.reset());

  afterAll(() => {
    trace.disable();
    context.disable();
  });

  it('ends the span and returns the result on success', async () => {
    const result = await withSpan('ai.generate', { feature: 'diagnose' }, () =>
      Promise.resolve(42),
    );
    expect(result).toBe(42);
    const [span] = exporter.getFinishedSpans();
    expect(span.name).toBe('ai.generate');
    expect(span.attributes.feature).toBe('diagnose');
    expect(span.status.code).not.toBe(SpanStatusCode.ERROR);
  });

  it('records the exception, marks ERROR, ends the span and rethrows', async () => {
    const boom = new Error('provider down');
    await expect(
      withSpan('ai.generate', {}, () => Promise.reject(boom)),
    ).rejects.toBe(boom);
    const [span] = exporter.getFinishedSpans();
    expect(span.status.code).toBe(SpanStatusCode.ERROR);
    expect(span.events.some((e) => e.name === 'exception')).toBe(true);
  });

  it('makes the span active for nested work', async () => {
    let innerTraceId: string | undefined;
    await withSpan('outer', {}, () => {
      innerTraceId = trace.getActiveSpan()?.spanContext().traceId;
      return Promise.resolve();
    });
    const [span] = exporter.getFinishedSpans();
    expect(innerTraceId).toBe(span.spanContext().traceId);
  });
});
