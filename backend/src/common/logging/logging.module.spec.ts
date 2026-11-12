import { context, trace, TraceFlags } from '@opentelemetry/api';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import pino from 'pino';
import { Writable } from 'stream';
import { buildPinoOptions } from './logging.module';
import { RequestContext } from './request-context';

function capture() {
  const lines: Record<string, unknown>[] = [];
  const stream = new Writable({
    write(chunk: Buffer, _enc, cb) {
      lines.push(JSON.parse(chunk.toString()) as Record<string, unknown>);
      cb();
    },
  });
  const logger = pino(
    buildPinoOptions({
      service: 'bagicha-backend',
      version: '0.0.1',
      env: 'test',
    }),
    stream,
  );
  return { logger, lines };
}

describe('structured logging', () => {
  const contextManager = new AsyncLocalStorageContextManager();

  beforeAll(() => {
    context.setGlobalContextManager(contextManager.enable());
  });

  afterAll(() => {
    contextManager.disable();
    context.disable();
  });

  it('writes the fixed fields on every line', () => {
    const { logger, lines } = capture();
    logger.info({ plantId: 'p1' }, 'Plant created');
    expect(lines[0]).toMatchObject({
      level: 'info',
      service: 'bagicha-backend',
      version: '0.0.1',
      env: 'test',
      message: 'Plant created',
      plantId: 'p1',
    });
    expect(typeof lines[0].timestamp).toBe('string');
  });

  it('adds traceId and spanId inside an active span', () => {
    const { logger, lines } = capture();
    const span = trace.wrapSpanContext({
      traceId: '0af7651916cd43dd8448eb211c80319c',
      spanId: 'b7ad6b7169203331',
      traceFlags: TraceFlags.SAMPLED,
    });
    context.with(trace.setSpan(context.active(), span), () => {
      logger.info('inside span');
    });
    expect(lines[0]).toMatchObject({
      traceId: '0af7651916cd43dd8448eb211c80319c',
      spanId: 'b7ad6b7169203331',
    });
  });

  it('adds userId when the request context knows the user', () => {
    const { logger, lines } = capture();
    RequestContext.run({ requestId: 'r1' }, () => {
      RequestContext.setUser('u42');
      logger.info('authenticated work');
    });
    expect(lines[0]).toMatchObject({ userId: 'u42', requestId: 'r1' });
  });

  it('omits userId outside a request', () => {
    const { logger, lines } = capture();
    logger.info('background work');
    expect(lines[0].userId).toBeUndefined();
  });

  it('never writes request headers at all (so no tokens, cookies or signatures), only method and route', () => {
    const { logger, lines } = capture();
    logger.info(
      {
        req: {
          headers: {
            authorization: 'Bearer eyJhbGciOi.secret',
            cookie: 'session=abc',
            'x-razorpay-signature': 'deadbeef',
            'user-agent': 'curl',
          },
        },
      },
      'request completed',
    );
    const raw = JSON.stringify(lines[0]);
    expect(raw).not.toContain('eyJhbGciOi');
    expect(raw).not.toContain('session=abc');
    expect(raw).not.toContain('deadbeef');
    expect(raw).not.toContain('curl');
  });
});
