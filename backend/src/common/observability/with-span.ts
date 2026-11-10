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
      span.recordException(
        error instanceof Error ? error : new Error(String(error)),
      );
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      span.end();
    }
  });
}
