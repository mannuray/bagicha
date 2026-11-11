import { redisConnection } from './redis-connection';

const config = (values: Record<string, string | undefined>) => ({
  get: <T>(key: string, fallback?: T) => (values[key] ?? fallback) as T,
});

describe('redisConnection', () => {
  it('uses REDIS_URL when set, with TLS for rediss://', () => {
    expect(
      redisConnection(
        config({ REDIS_URL: 'rediss://user:pw@red-abc.example.com:6380' }),
      ),
    ).toEqual({
      host: 'red-abc.example.com',
      port: 6380,
      username: 'user',
      password: 'pw',
      tls: {},
      maxRetriesPerRequest: null,
    });
  });

  it('reads a plain redis:// URL without TLS', () => {
    expect(
      redisConnection(config({ REDIS_URL: 'redis://red-abc:6379' })),
    ).toEqual({
      host: 'red-abc',
      port: 6379,
      maxRetriesPerRequest: null,
    });
  });

  it('falls back to REDIS_HOST and REDIS_PORT locally', () => {
    expect(
      redisConnection(config({ REDIS_HOST: 'cache', REDIS_PORT: '6390' })),
    ).toEqual({
      host: 'cache',
      port: 6390,
      maxRetriesPerRequest: null,
    });
  });

  it('picks the database number from the URL path, so two apps can share one Redis', () => {
    expect(
      redisConnection(config({ REDIS_URL: 'redis://red-shared:6379/1' })),
    ).toEqual({
      host: 'red-shared',
      port: 6379,
      db: 1,
      maxRetriesPerRequest: null,
    });
  });
});
