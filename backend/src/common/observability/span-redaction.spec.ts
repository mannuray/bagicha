import {
  redactIncomingHttpSpan,
  redactOutgoingHttpSpan,
  redisStatement,
} from './span-redaction';

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
    expect(attrs['network.peer.address']).toBe('');
    expect(JSON.stringify(attrs)).not.toContain('9876543210');
  });

  it('an outgoing HTTP span drops the query string: it can carry an API key', () => {
    const attrs: Record<string, unknown> = {};
    const span = { setAttribute: (k: string, v: unknown) => (attrs[k] = v) };
    redactOutgoingHttpSpan(span, {
      origin: 'https://customer-api.open-meteo.com',
      path: '/v1/forecast?latitude=25.65&apikey=SECRET',
    });
    expect(attrs['url.full']).toBe(
      'https://customer-api.open-meteo.com/v1/forecast',
    );
    expect(attrs['url.query']).toBe('');
    expect(JSON.stringify(attrs)).not.toContain('SECRET');
  });
});
