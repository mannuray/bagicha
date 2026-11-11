import type { ClientOptions } from 'minio';

interface ConfigReader {
  get<T>(key: string, fallback?: T): T;
}

/**
 * The object-store client: local MinIO by default, or AWS S3 when MEDIA_ENDPOINT,
 * MEDIA_REGION and MEDIA_ACCESS_KEY / MEDIA_SECRET_KEY are set (staging).
 * MINIO_ROOT_USER / MINIO_ROOT_PASSWORD remain the local fallbacks.
 */
export function mediaClientOptions(config: ConfigReader): ClientOptions {
  const region = config.get<string | undefined>('MEDIA_REGION');
  return {
    endPoint: config.get<string>('MEDIA_ENDPOINT', 'localhost'),
    port: parseInt(config.get<string>('MEDIA_PORT', '9000'), 10),
    useSSL: config.get<string>('MEDIA_USE_SSL', 'false') === 'true',
    ...(region ? { region } : {}),
    accessKey:
      config.get<string | undefined>('MEDIA_ACCESS_KEY') ??
      config.get<string>('MINIO_ROOT_USER', 'minioadmin'),
    secretKey:
      config.get<string | undefined>('MEDIA_SECRET_KEY') ??
      config.get<string>('MINIO_ROOT_PASSWORD', 'minioadmin'),
  };
}
