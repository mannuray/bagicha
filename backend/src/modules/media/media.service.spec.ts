import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';

const bucketExists = jest.fn();
jest.mock('minio', () => ({
  Client: jest.fn(() => ({
    bucketExists,
    makeBucket: jest.fn(),
    setBucketPolicy: jest.fn(() => Promise.resolve()),
  })),
}));

import { MediaService } from './media.service';

describe('MediaService start-up', () => {
  it('does not hold up boot on the storage round trips (cold starts)', async () => {
    bucketExists.mockReturnValue(new Promise(() => undefined)); // never answers
    const config = {
      get: (_k: string, fallback?: unknown) => fallback,
    } as unknown as ConfigService;
    const warn = jest.fn();
    const service = new MediaService(config, {
      warn,
      info: jest.fn(),
    } as unknown as PinoLogger);
    const started = await Promise.race([
      service.onModuleInit().then(() => 'started'),
      new Promise((resolve) => setTimeout(() => resolve('blocked'), 200)),
    ]);
    expect(started).toBe('started');
  });
});
