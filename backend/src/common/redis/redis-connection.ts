import type { RedisOptions } from 'ioredis';

interface ConfigReader {
  get<T>(key: string, fallback?: T): T;
}

/**
 * ioredis options from REDIS_URL (hosted Redis; `rediss://` means TLS), else
 * REDIS_HOST and REDIS_PORT (local docker). BullMQ needs
 * maxRetriesPerRequest: null on its connections.
 */
export function redisConnection(config: ConfigReader): RedisOptions {
  const url = config.get<string | undefined>('REDIS_URL');
  if (url) {
    const u = new URL(url);
    // "/1" picks database 1: staging shares one Redis with another app, apart by database.
    const db = Number(u.pathname.replace('/', '')) || 0;
    return {
      host: u.hostname,
      port: Number(u.port || 6379),
      ...(u.username ? { username: decodeURIComponent(u.username) } : {}),
      ...(u.password ? { password: decodeURIComponent(u.password) } : {}),
      ...(u.protocol === 'rediss:' ? { tls: {} } : {}),
      ...(db ? { db } : {}),
      maxRetriesPerRequest: null,
    };
  }
  return {
    host: config.get<string>('REDIS_HOST', 'localhost'),
    port: Number(config.get<string>('REDIS_PORT', '6379')),
    maxRetriesPerRequest: null,
  };
}
