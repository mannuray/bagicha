import sharp from 'sharp';
import { ValidationError } from '../../common/errors';
import { IMAGE_MAX_DIMENSION, IMAGE_QUALITY } from './media.config';

/** Decoding is bounded: a few MB of crafted PNG can claim gigabytes of pixels. */
export const MAX_INPUT_PIXELS = 40_000_000;
const ALLOWED_FORMATS = new Set(['jpeg', 'png', 'webp']);

// One image at a time on a small instance, and no decoded-image cache held in memory.
sharp.concurrency(1);
sharp.cache(false);

/**
 * Re-encodes an untrusted upload as a stripped JPEG, refusing anything that isn't a
 * JPEG, PNG or WebP by its actual bytes (never the client's content type) and any
 * image larger than MAX_INPUT_PIXELS before it is decoded.
 */
export async function decodeSafely(input: Buffer) {
  let meta: sharp.Metadata;
  try {
    meta = await sharp(input, { limitInputPixels: false }).metadata();
  } catch {
    throw new ValidationError(
      'MEDIA_TYPE_UNSUPPORTED',
      'Only JPEG, PNG or WebP images can be uploaded',
    );
  }
  if (!meta.format || !ALLOWED_FORMATS.has(meta.format)) {
    throw new ValidationError(
      'MEDIA_TYPE_UNSUPPORTED',
      'Only JPEG, PNG or WebP images can be uploaded',
    );
  }
  if ((meta.width ?? 0) * (meta.height ?? 0) > MAX_INPUT_PIXELS) {
    throw new ValidationError(
      'IMAGE_TOO_LARGE',
      'That photo has too many pixels',
    );
  }
  try {
    return await sharp(input, {
      failOn: 'error',
      limitInputPixels: MAX_INPUT_PIXELS,
    })
      .rotate() // honour EXIF orientation, then strip
      .resize({
        width: IMAGE_MAX_DIMENSION,
        height: IMAGE_MAX_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: IMAGE_QUALITY, mozjpeg: true })
      .withMetadata({})
      .toBuffer({ resolveWithObject: true });
  } catch {
    throw new ValidationError(
      'MEDIA_UNREADABLE',
      'That photo could not be read',
    );
  }
}
