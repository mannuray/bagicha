import { redactIncomingHttpSpan, redisStatement } from './span-redaction';

describe('span redaction', () => {
  it('a Redis span records the command name only, never its keys or job data', () => {
    expect(
      redisStatement('evalsha', [
        'abc',
        '1',
        '{"user_id":"u1","pincode":"800001"}',
      ]),
    ).toBe('evalsha');
    expect(redisStatement('set', ['otp:...', '123456'])).toBe('set');
  });

  it('an incoming HTTP span keeps the path but drops the query string and client address', () => {
    const attrs: Record<string, unknown> = {};
    const span = { setAttribute: (k: string, v: unknown) => (attrs[k] = v) };
    redactIncomingHttpSpan(span, {
      url: '/api/v1/ledger/plants?phone=9876543210',
    });
    expect(attrs['http.target']).toBe('/api/v1/ledger/plants');
    expect(attrs['url.query']).toBe('');
    expect(attrs['http.client_ip']).toBe('');
    expect(attrs['client.address']).toBe('');
    expect(JSON.stringify(attrs)).not.toContain('9876543210');
  });
});
