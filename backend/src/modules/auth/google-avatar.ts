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
    const res = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: 'follow',
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const declared = Number(res.headers.get('content-length') ?? '0');
    if (declared > MAX_UPLOAD_BYTES) throw new Error('too large');
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length > MAX_UPLOAD_BYTES) throw new Error('too large');
    return buffer;
  }
}
