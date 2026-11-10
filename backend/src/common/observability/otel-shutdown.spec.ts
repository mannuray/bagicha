import { OtelShutdownHook, registerOtelSdk } from './otel-handle';

describe('OpenTelemetry shutdown', () => {
  afterEach(() => registerOtelSdk(undefined));

  it('flushes the registered SDK when Nest shuts down', async () => {
    const shutdown = jest.fn(() => Promise.resolve());
    registerOtelSdk({ shutdown });
    await new OtelShutdownHook().onApplicationShutdown();
    expect(shutdown).toHaveBeenCalledTimes(1);
  });

  it('is a no-op when instrumentation was not loaded', async () => {
    await expect(
      new OtelShutdownHook().onApplicationShutdown(),
    ).resolves.toBeUndefined();
  });

  it('instrumentation does not take over SIGTERM/SIGINT (Nest owns shutdown)', () => {
    const before = {
      term: process.listenerCount('SIGTERM'),
      int: process.listenerCount('SIGINT'),
    };
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('../../instrumentation');
    });
    expect(process.listenerCount('SIGTERM')).toBe(before.term);
    expect(process.listenerCount('SIGINT')).toBe(before.int);
  });
});
