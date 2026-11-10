import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

/** Browser origins allowed to call the API. Empty (nothing allowed) when unset. */
export function parseWebOrigins(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

/** CORS options for the allow-list, or null to leave CORS off entirely. */
export function corsOptionsFor(origins: string[]): CorsOptions | null {
  if (origins.length === 0) return null;
  return {
    origin: origins,
    credentials: false,
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Request-Id'],
  };
}
