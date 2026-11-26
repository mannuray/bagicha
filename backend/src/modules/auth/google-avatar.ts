import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { MediaService } from '../media';
import { MAX_UPLOAD_BYTES } from '../media/media.config';

const FETCH_TIMEOUT_MS = 5000;

/**
 * Copies a new gardener's Google profile photo into our own storage once, so
 * the app never loads images from Google. Any failure just means no photo.
 */
@Injectable()
export class GoogleAvatarImporter {
  constructor(
    private readonly media: MediaService,
    @InjectPinoLogger(GoogleAvatarImporter.name)
    private readonly logger: PinoLogger,
  ) {}

  /** The stored avatar key, or null if the photo could not be fetched or stored. */
  async importFrom(userId: string, pictureUrl: string): Promise<string | null> {
    try {
      const buffer = await this.download(pictureUrl);
      const { key } = await this.media.uploadImage(
        {
          buffer,
          mimetype: 'image/jpeg',
          size: buffer.length,
          originalname: 'google-photo',
        },
        'avatar',
        userId,
      );
      return key;
    } catch (err) {
      // No URL in the log: it identifies the Google account.
      this.logger.warn(
        { err: { type: (err as Error).name } },
        'Google profile photo not imported',
      );
      return null;
    }
  }

  private async download(url: string): Promise<Buffer> {
    // The URL comes from Google's signed token; still, only fetch Google's photo host.
    const { protocol, hostname } = new URL(url);
    if (protocol !== 'https:' || !hostname.endsWith('.googleusercontent.com')) {
      throw new Error('not a Google photo URL');
    }
    // No redirects: the host check above must hold for the bytes we read.
    const res = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: 'error',
    });
    if (!res.ok || !res.body) throw new Error(`status ${res.status}`);
    const declared = Number(res.headers.get('content-length') ?? '0');
    if (declared > MAX_UPLOAD_BYTES) throw new Error('too large');
    return readCapped(res.body, MAX_UPLOAD_BYTES);
  }
}

/** Reads a body, giving up as soon as it passes `cap` bytes (a missing length can't make us read it all). */
async function readCapped(
  body: ReadableStream<Uint8Array>,
  cap: number,
): Promise<Buffer> {
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return Buffer.concat(chunks);
    total += value.length;
    if (total > cap) {
      await reader.cancel();
      throw new Error('too large');
    }
    chunks.push(value);
  }
}
