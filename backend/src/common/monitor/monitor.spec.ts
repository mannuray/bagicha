import { ConfigService } from '@nestjs/config';
import { MonitorContext } from './monitor.context';
import { MonitorMiddleware } from './monitor.middleware';
import { MonitorService } from './monitor.service';

const config = (env: Record<string, string>) =>
  ({ get: (k: string, d?: string) => env[k] ?? d }) as unknown as ConfigService;

describe('the kathawachak monitor', () => {
  it('is off unless KATHAWACHAK_ENABLED=true', () => {
    expect(new MonitorService(config({ NODE_ENV: 'staging' })).enabled).toBe(
      false,
    );
    expect(
      new MonitorService(
        config({ NODE_ENV: 'staging', KATHAWACHAK_ENABLED: 'true' }),
      ).enabled,
    ).toBe(true);
  });

  it('keeps no raw URL (ids, query strings) in its request context', () => {
    const monitor = new MonitorService(
      config({ NODE_ENV: 'staging', KATHAWACHAK_ENABLED: 'true' }),
    );
    const req = {
      headers: {},
      method: 'GET',
      originalUrl: '/api/v1/ledger/plants/abc?phone=9876543210',
      url: '/x',
    };
    let seen: unknown;
    new MonitorMiddleware(monitor).use(req as never, {} as never, () => {
      seen = MonitorContext.get();
    });
    expect(JSON.stringify(seen)).not.toContain('9876543210');
    expect(JSON.stringify(seen)).not.toContain('/plants/abc');
  });
});
