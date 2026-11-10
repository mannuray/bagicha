import { describe, expect, it, vi } from 'vitest';
import { AppStateError } from '../../lib/errors';
import { createImageCompressor, type ImageOps } from './image-compressor';

const photo = (bytes = 1000, type = 'image/jpeg') => new File([new Uint8Array(bytes)], 'p.jpg', { type });

function ops(width: number, height: number, sizeFor: (w: number, q: number) => number): ImageOps & { renders: Array<[number, number, number]> } {
  const renders: Array<[number, number, number]> = [];
  return {
    renders,
    decode: vi.fn(() => Promise.resolve({ width, height })),
    render: vi.fn((_src, w: number, h: number, q: number) => {
      renders.push([w, h, q]);
      return Promise.resolve(new Blob([new Uint8Array(sizeFor(Math.max(w, h), q))], { type: 'image/jpeg' }));
    }),
  };
}

describe('image compressor', () => {
  it('scales a 12 MP photo so the long edge is 1600 px at quality 0.8', async () => {
    const o = ops(4000, 3000, () => 300_000);
    const out = await createImageCompressor(o).compress(photo());
    expect(o.renders[0]).toEqual([1600, 1200, 0.8]);
    expect(out).toMatchObject({ width: 1600, height: 1200 });
    expect(out.base64.length).toBeGreaterThan(0);
  });

  it('never upscales a small photo', async () => {
    const o = ops(800, 600, () => 50_000);
    await createImageCompressor(o).compress(photo());
    expect(o.renders[0]).toEqual([800, 600, 0.8]);
  });

  it('steps down quality, then size, to fit under 6 MB of base64', async () => {
    const o = ops(4000, 3000, (edge, q) => (edge === 1200 ? 1_000_000 : q === 0.8 ? 6_000_000 : 5_000_000));
    const out = await createImageCompressor(o).compress(photo());
    expect(o.renders.map(([w, , q]) => [w, q])).toEqual([[1600, 0.8], [1600, 0.6], [1200, 0.6]]);
    expect(out.width).toBe(1200);
  });

  it('gives up with IMAGE_TOO_LARGE when nothing fits (Review Focus #2)', async () => {
    const o = ops(4000, 3000, () => 7_000_000);
    await expect(createImageCompressor(o).compress(photo())).rejects.toMatchObject({ code: 'IMAGE_TOO_LARGE' });
  });

  it.each([
    ['a text file', photo(10, 'text/plain')],
    ['an empty file', photo(0)],
  ])('rejects %s with IMAGE_UNSUPPORTED before decoding', async (_label, file) => {
    const o = ops(10, 10, () => 10);
    const err = await createImageCompressor(o).compress(file).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(AppStateError);
    expect((err as AppStateError).code).toBe('IMAGE_UNSUPPORTED');
    expect(o.decode).not.toHaveBeenCalled();
  });

  it('treats an image the browser cannot decode (e.g. HEIC) as unsupported', async () => {
    const o = ops(10, 10, () => 10);
    o.decode = vi.fn(() => Promise.reject(new Error('decode failed')));
    await expect(createImageCompressor(o).compress(photo(10, 'image/heic'))).rejects.toMatchObject({ code: 'IMAGE_UNSUPPORTED' });
  });
});
