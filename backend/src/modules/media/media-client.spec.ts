import { mediaClientOptions } from './media-client';

const config = (values: Record<string, string | undefined>) => ({
  get: <T>(key: string, fallback?: T) => (values[key] ?? fallback) as T,
});

describe('mediaClientOptions', () => {
  it('talks to local MinIO by default', () => {
    expect(mediaClientOptions(config({}))).toEqual({
      endPoint: 'localhost',
      port: 9000,
      useSSL: false,
      accessKey: 'minioadmin',
      secretKey: 'minioadmin',
    });
  });

  it('talks to AWS S3 with a region and its own keys', () => {
    expect(
      mediaClientOptions(
        config({
          MEDIA_ENDPOINT: 's3.ap-south-1.amazonaws.com',
          MEDIA_PORT: '443',
          MEDIA_USE_SSL: 'true',
          MEDIA_REGION: 'ap-south-1',
          MEDIA_ACCESS_KEY: 'AKIA_TEST',
          MEDIA_SECRET_KEY: 'secret',
        }),
      ),
    ).toEqual({
      endPoint: 's3.ap-south-1.amazonaws.com',
      port: 443,
      useSSL: true,
      region: 'ap-south-1',
      accessKey: 'AKIA_TEST',
      secretKey: 'secret',
    });
  });
});
