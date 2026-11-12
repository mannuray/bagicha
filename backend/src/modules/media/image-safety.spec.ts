import sharp from 'sharp';
import { deflateSync } from 'zlib';
import { decodeSafely } from './image-safety';

/** A tiny PNG whose header claims an enormous image (a "decompression bomb"). */
function pngClaiming(width: number, height: number): Buffer {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf: Buffer) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type), data]);
    const sum = Buffer.alloc(4);
    sum.writeUInt32BE(crc(body));
    return Buffer.concat([len, body, sum]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // truecolour
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(Buffer.alloc(16))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

describe('decodeSafely: untrusted uploads', () => {
  it('refuses an image claiming more than 40 megapixels before decoding it', async () => {
    await expect(decodeSafely(pngClaiming(20000, 20000))).rejects.toMatchObject(
      { reason: 'IMAGE_TOO_LARGE' },
    );
  });

  it('refuses formats other than JPEG, PNG and WebP, whatever the client claims', async () => {
    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>',
    );
    await expect(decodeSafely(svg)).rejects.toMatchObject({
      reason: 'MEDIA_TYPE_UNSUPPORTED',
    });
  });

  it('strips EXIF (a phone photo carries GPS; post images are public)', async () => {
    const withExif = await sharp({
      create: { width: 20, height: 10, channels: 3, background: '#4a7' },
    })
      .jpeg()
      .withExif({ IFD0: { Copyright: 'home at 25.6,85.1' } })
      .toBuffer();
    expect((await sharp(withExif).metadata()).exif).toBeDefined();
    const { data } = await decodeSafely(withExif);
    const meta = await sharp(data).metadata();
    expect(meta.exif).toBeUndefined();
    expect(meta.xmp).toBeUndefined();
    expect(meta.iptc).toBeUndefined();
  });

  it('re-encodes an ordinary image as a JPEG', async () => {
    const png = await sharp({
      create: { width: 20, height: 10, channels: 3, background: '#2d5a27' },
    })
      .png()
      .toBuffer();
    const out = await decodeSafely(png);
    expect(out.info.format).toBe('jpeg');
    expect(out.info.width).toBe(20);
  });
});
