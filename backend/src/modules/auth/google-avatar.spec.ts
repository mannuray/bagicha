import { MAX_UPLOAD_BYTES } from '../media/media.config';
import { GoogleAvatarImporter } from './google-avatar';

const PHOTO = 'https://lh3.googleusercontent.com/a/photo';

function build(
  upload: jest.Mock = jest.fn(() =>
    Promise.resolve({ key: 'avatars/u1/p.jpg' }),
  ),
) {
  const media = { uploadImage: upload };
  const logger = { warn: jest.fn() };
  return {
    importer: new GoogleAvatarImporter(media as never, logger as never),
    upload,
    logger,
  };
}

/** A response whose body arrives in chunks and declares no length (chunked transfer). */
function streamed(chunks: Uint8Array[], init: ResponseInit = {}) {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const c of chunks) controller.enqueue(c);
      controller.close();
    },
  });
  return new Response(body, { status: 200, ...init });
}

describe('GoogleAvatarImporter', () => {
  let fetchSpy: jest.SpyInstance;
  beforeEach(() => {
    fetchSpy = jest.spyOn(global, 'fetch');
  });
  afterEach(() => jest.restoreAllMocks());

  it('stores the photo and returns its key', async () => {
    fetchSpy.mockResolvedValue(streamed([new Uint8Array([1, 2, 3])]));
    const t = build();
    await expect(t.importer.importFrom('u1', PHOTO)).resolves.toBe(
      'avatars/u1/p.jpg',
    );
    expect(t.upload).toHaveBeenCalledWith(
      expect.objectContaining({ size: 3 }),
      'avatar',
      'u1',
    );
  });

  it('refuses redirects, so a redirect cannot leave Google', async () => {
    fetchSpy.mockResolvedValue(streamed([new Uint8Array([1])]));
    await build().importer.importFrom('u1', PHOTO);
    expect(fetchSpy).toHaveBeenCalledWith(
      PHOTO,
      expect.objectContaining({ redirect: 'error' }),
    );
  });

  it('never fetches from a host other than Google’s photo host', async () => {
    const t = build();
    await expect(
      t.importer.importFrom('u1', 'https://evil.example.com/x.jpg'),
    ).resolves.toBeNull();
    await expect(
      t.importer.importFrom('u1', 'http://lh3.googleusercontent.com/a/photo'),
    ).resolves.toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('gives no photo when Google answers with an error', async () => {
    fetchSpy.mockResolvedValue(new Response('nope', { status: 404 }));
    const t = build();
    await expect(t.importer.importFrom('u1', PHOTO)).resolves.toBeNull();
    expect(t.upload).not.toHaveBeenCalled();
  });

  it('gives no photo when the declared size is too large', async () => {
    fetchSpy.mockResolvedValue(
      new Response('x', {
        status: 200,
        headers: { 'content-length': String(MAX_UPLOAD_BYTES + 1) },
      }),
    );
    const t = build();
    await expect(t.importer.importFrom('u1', PHOTO)).resolves.toBeNull();
    expect(t.upload).not.toHaveBeenCalled();
  });

  it('stops reading a body with no length once it passes the size cap', async () => {
    const chunk = new Uint8Array(1024 * 1024);
    const pulls = { count: 0 };
    const endless = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulls.count += 1;
        controller.enqueue(chunk); // never closes: a body that keeps coming
      },
    });
    fetchSpy.mockResolvedValue(new Response(endless, { status: 200 }));
    const t = build();
    await expect(t.importer.importFrom('u1', PHOTO)).resolves.toBeNull();
    expect(t.upload).not.toHaveBeenCalled();
    expect(pulls.count).toBeLessThanOrEqual(
      MAX_UPLOAD_BYTES / chunk.length + 2,
    );
  });

  it('gives no photo when the download fails or times out', async () => {
    fetchSpy.mockRejectedValue(new DOMException('timed out', 'TimeoutError'));
    await expect(build().importer.importFrom('u1', PHOTO)).resolves.toBeNull();
  });

  it('gives no photo when storage refuses it (not an image)', async () => {
    fetchSpy.mockResolvedValue(streamed([new Uint8Array([1])]));
    const t = build(
      jest.fn(() => Promise.reject(new Error('MEDIA_UNREADABLE'))),
    );
    await expect(t.importer.importFrom('u1', PHOTO)).resolves.toBeNull();
  });

  it('logs no URL when it gives up', async () => {
    fetchSpy.mockResolvedValue(new Response('nope', { status: 500 }));
    const t = build();
    await t.importer.importFrom('u1', PHOTO);
    expect(JSON.stringify(t.logger.warn.mock.calls)).not.toContain(
      'googleusercontent',
    );
  });
});
