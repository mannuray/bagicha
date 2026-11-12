import { Attributes, Span, SpanStatusCode, trace } from '@opentelemetry/api';

const tracer = () => trace.getTracer('bagicha-backend');

/**
 * Runs `fn` inside an active span. The span always ends; failures are
 * recorded on it and rethrown unchanged.
 */
export async function withSpan<T>(
  name: string,
  attributes: Attributes,
  fn: (span: Span) => Promise<T>,
): Promise<T> {
  return tracer().startActiveSpan(name, { attributes }, async (span) => {
    try {
      return await fn(span);
    } catch (error) {
      // Only the error's type: a message can carry a connection string, a URL or user text.
      const name =
        error instanceof Error ? error.constructor.name : typeof error;
      span.recordException({ name, message: name });
      span.setStatus({ code: SpanStatusCode.ERROR, message: name });
      throw error;
    } finally {
      span.end();
    }
  });
}
