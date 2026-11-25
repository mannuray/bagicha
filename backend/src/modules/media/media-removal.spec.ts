import { Readable } from 'stream';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';

const listObjectsV2 = jest.fn();
const removeObjects = jest.fn(() => Promise.resolve([]));
jest.mock('minio', () => ({
  Client: jest.fn(() => ({
    bucketExists: jest.fn(() => Promise.resolve(true)),
    setBucketPolicy: jest.fn(() => Promise.resolve()),
    listObjectsV2,
    removeObjects,
  })),
}));

import { MediaService } from './media.service';

function service(): MediaService {
  const config = {
    get: (_k: string, fallback?: unknown) => fallback,
  } as unknown as ConfigService;
  const s = new MediaService(config, {
    warn: jest.fn(),
    info: jest.fn(),
  } as unknown as PinoLogger);
  void s.onModuleInit();
  return s;
}

const objects = (names: string[]) =>
  Readable.from(names.map((name) => ({ name })));

describe('MediaService.removeOwnerMedia', () => {
  beforeEach(() => {
    listObjectsV2.mockReset();
    removeObjects.mockClear();
  });

  it("lists every kind's folder for that owner only and removes what it finds", async () => {
    listObjectsV2.mockImplementation((_b: string, prefix: string) =>
      objects(
        prefix === 'posts/u1/' ? ['posts/u1/a.jpg', 'posts/u1/b.jpg'] : [],
      ),
    );
    await expect(service().removeOwnerMedia('u1')).resolves.toBe(2);
    expect(listObjectsV2.mock.calls.map((c) => c[1]).sort()).toEqual([
      'avatars/u1/',
      'journal/u1/',
      'posts/u1/',
      'vision/u1/',
    ]);
    expect(listObjectsV2.mock.calls.every((c) => c[2] === true)).toBe(true);
    expect(removeObjects).toHaveBeenCalledTimes(1);
    expect(removeObjects).toHaveBeenCalledWith('bagicha-media', [
      'posts/u1/a.jpg',
      'posts/u1/b.jpg',
    ]);
  });

  it('removes nothing when the owner has no photos', async () => {
    listObjectsV2.mockImplementation(() => objects([]));
    await expect(service().removeOwnerMedia('u1')).resolves.toBe(0);
    expect(removeObjects).not.toHaveBeenCalled();
  });

  it('removes in chunks of at most 1000 (the S3 batch limit)', async () => {
    const many = Array.from({ length: 1001 }, (_, i) => `vision/u1/${i}.jpg`);
    listObjectsV2.mockImplementation((_b: string, prefix: string) =>
      objects(prefix === 'vision/u1/' ? many : []),
    );
    await expect(service().removeOwnerMedia('u1')).resolves.toBe(1001);
    expect(
      removeObjects.mock.calls
        .map((c) => (c as unknown[])[1] as string[])
        .map((n) => n.length),
    ).toEqual([1000, 1]);
  });

  it('fails loudly when listing fails (so the account is retried, not half-erased)', async () => {
    listObjectsV2.mockImplementation(
      () =>
        new Readable({
          objectMode: true,
          read() {
            this.destroy(new Error('AccessDenied'));
          },
        }),
    );
    await expect(service().removeOwnerMedia('u1')).rejects.toThrow(
      'AccessDenied',
    );
  });

  it('refuses an owner id that could reach outside its folder', async () => {
    await expect(service().removeOwnerMedia('')).rejects.toThrow();
    await expect(service().removeOwnerMedia('u1/../x')).rejects.toThrow();
    expect(listObjectsV2).not.toHaveBeenCalled();
  });
});
