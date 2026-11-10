import { AppStateError } from '../../lib/errors';

/** Comfortably under the backend's 8 MB JSON limit for scans, after JSON overhead. */
export const MAX_BASE64_CHARS = 6 * 1024 * 1024;
const ATTEMPTS: ReadonlyArray<{ edge: number; quality: number }> = [
  { edge: 1600, quality: 0.8 },
  { edge: 1600, quality: 0.6 },
  { edge: 1200, quality: 0.6 },
];

export interface DecodedImage {
  width: number;
  height: number;
}

/** Device image primitives (browser canvas today; a Capacitor plugin could replace them). */
export interface ImageOps {
  decode(file: File): Promise<DecodedImage>;
  render(source: DecodedImage, width: number, height: number, quality: number): Promise<Blob>;
}

export interface CompressedImage {
  blob: Blob;
  base64: string;
  width: number;
  height: number;
}

export interface ImageCompressor {
  compress(file: File): Promise<CompressedImage>;
}

async function toBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

const unsupported = () => new AppStateError('IMAGE_UNSUPPORTED', 'Not a usable photo');

/** Shrinks camera photos to a JPEG that uploads quickly and fits the scan limit. */
export function createImageCompressor(ops: ImageOps): ImageCompressor {
  return {
    async compress(file) {
      if (file.size === 0 || !file.type.startsWith('image/')) throw unsupported();
      let source: DecodedImage;
      try {
        source = await ops.decode(file);
      } catch {
        throw unsupported();
      }
      for (const { edge, quality } of ATTEMPTS) {
        const scale = Math.min(1, edge / Math.max(source.width, source.height));
        const width = Math.round(source.width * scale);
        const height = Math.round(source.height * scale);
        const blob = await ops.render(source, width, height, quality);
        // base64 is 4/3 of the bytes; check before paying for the encoding.
        if (Math.ceil(blob.size / 3) * 4 <= MAX_BASE64_CHARS) {
          return { blob, base64: await toBase64(blob), width, height };
        }
      }
      throw new AppStateError('IMAGE_TOO_LARGE', 'Photo too large even after shrinking');
    },
  };
}

type BrowserImage = DecodedImage & { bitmap: CanvasImageSource };

/** Canvas-based image ops for browsers (createImageBitmap honours EXIF orientation). */
export const browserImageOps: ImageOps = {
  async decode(file) {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    return { width: bitmap.width, height: bitmap.height, bitmap } as BrowserImage;
  },
  render(source, width, height, quality) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return Promise.reject(new AppStateError('IMAGE_UNSUPPORTED', 'No canvas'));
    context.drawImage((source as BrowserImage).bitmap, 0, 0, width, height);
    return new Promise((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new AppStateError('IMAGE_UNSUPPORTED', 'Encoding failed'))),
        'image/jpeg',
        quality,
      ),
    );
  },
};

export const canvasImageCompressor = createImageCompressor(browserImageOps);
