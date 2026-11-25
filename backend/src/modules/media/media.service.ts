import { withSpan } from '../../common/observability';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client as MinioClient } from 'minio';
import { mediaClientOptions } from './media-client';
import { randomUUID } from 'crypto';
import {
  MAX_UPLOAD_BYTES,
  MEDIA_BUCKET_DEFAULT,
  MEDIA_PREFIXES,
  MediaKind,
  PUBLIC_PREFIXES,
  parseMediaKey,
} from './media.config';
import {
  InvariantError,
  NotFoundError,
  UpstreamError,
  ValidationError,
} from '../../common/errors';
import { decodeSafely } from './image-safety';

/**
 * The error code of one refused key, or null. minio 8.0.7 returns the
 * DeleteResult's <Error> entries bare ({Code, Key}), though its types say
 * {Error: {...}}: accept both.
 */
function refusalCode(entry: unknown): string | null {
  if (!entry || typeof entry !== 'object') return null;
  const e = entry as { Code?: string; Error?: { Code?: string } };
  if (e.Error) return e.Error.Code ?? 'Unknown';
  return e.Code ?? null;
}

/** S3's limit on keys per delete request. */
const REMOVE_BATCH = 1000;
/** An owner id as it appears in media keys: one path segment, never empty. */
const OWNER_ID = /^[A-Za-z0-9_-]+$/;

export interface MediaUploadResult {
  key: string;
  url: string;
  bucket: string;
  width: number;
  height: number;
  bytes: number;
  content_type: string;
  is_public: boolean;
}

@Injectable()
export class MediaService implements OnModuleInit {
  private client!: MinioClient;
  private bucket!: string;
  private publicBaseUrl!: string;
  private region?: string;

  constructor(
    private readonly config: ConfigService,
    @InjectPinoLogger(MediaService.name)
    private readonly logger: PinoLogger,
  ) {}

  onModuleInit(): Promise<void> {
    this.init();
    // The bucket normally exists already; checking it (and its policy) is two
    // storage round trips that shouldn't delay a cold start.
    void withSpan('minio.ensureBucket', { bucket: this.bucket }, () =>
      this.ensureBucket(),
    ).catch((err: unknown) =>
      this.logger.warn({ err }, 'Media bucket check failed'),
    );
    return Promise.resolve();
  }

  private init() {
    this.bucket = this.config.get<string>('MEDIA_BUCKET', MEDIA_BUCKET_DEFAULT);
    const options = mediaClientOptions(this.config);
    this.publicBaseUrl = this.config.get<string>(
      'MEDIA_PUBLIC_BASE_URL',
      `${options.useSSL ? 'https' : 'http'}://${options.endPoint}:${options.port}`,
    );
    this.region = options.region;
    this.client = new MinioClient(options);
  }

  async uploadImage(
    file: {
      buffer: Buffer;
      mimetype: string;
      size: number;
      originalname: string;
    },
    kind: MediaKind,
    ownerId: string,
  ): Promise<MediaUploadResult> {
    if (!file?.buffer || file.size === 0) {
      throw new ValidationError('MEDIA_FILE_MISSING', 'No file uploaded');
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new ValidationError('PAYLOAD_TOO_LARGE', 'That photo is too large');
    }
    // The bytes decide, not the client's content type (image-safety.ts).
    const processed = await decodeSafely(file.buffer);

    const key = this.buildKey(kind, ownerId);
    await withSpan('minio.putObject', { bucket: this.bucket }, () =>
      this.client.putObject(
        this.bucket,
        key,
        processed.data,
        processed.data.length,
        {
          'Content-Type': 'image/jpeg',
          'x-amz-meta-owner-id': ownerId,
          'x-amz-meta-kind': kind,
        },
      ),
    );

    const isPublic = PUBLIC_PREFIXES.has(kind);
    const url = isPublic
      ? this.buildPublicUrl(key)
      : await this.getDownloadUrl(key);

    return {
      key,
      url,
      bucket: this.bucket,
      width: processed.info.width,
      height: processed.info.height,
      bytes: processed.info.size,
      content_type: 'image/jpeg',
      is_public: isPublic,
    };
  }

  /** Signs a download URL only if the caller may read the key; otherwise 404. */
  async getDownloadUrlFor(
    callerId: string,
    key: string,
    expirySeconds: number,
  ): Promise<string> {
    const parsed = parseMediaKey(key);
    if (!parsed) throw new NotFoundError('MEDIA_NOT_FOUND', 'Media not found');
    if (!PUBLIC_PREFIXES.has(parsed.kind) && parsed.ownerId !== callerId) {
      throw new NotFoundError('MEDIA_NOT_FOUND', 'Media not found');
    }
    return this.getDownloadUrl(key, expirySeconds);
  }

  private async getDownloadUrl(
    key: string,
    expirySeconds = 60 * 60,
  ): Promise<string> {
    return withSpan('minio.presignedGetObject', { bucket: this.bucket }, () =>
      this.client.presignedGetObject(this.bucket, key, expirySeconds),
    );
  }

  /**
   * Deletes every photo this owner uploaded, of every kind, and returns how
   * many. Throws if listing or deleting fails, so the caller can retry later
   * rather than treat the owner as cleaned up.
   */
  async removeOwnerMedia(ownerId: string): Promise<number> {
    if (!OWNER_ID.test(ownerId)) {
      throw new InvariantError(
        'Refusing to remove media for a malformed owner id',
      );
    }
    let removed = 0;
    for (const prefix of Object.values(MEDIA_PREFIXES)) {
      const keys = await this.listKeys(`${prefix}/${ownerId}/`);
      for (let i = 0; i < keys.length; i += REMOVE_BATCH) {
        const chunk = keys.slice(i, i + REMOVE_BATCH);
        const results = await withSpan(
          'minio.removeObjects',
          { bucket: this.bucket },
          () => this.client.removeObjects(this.bucket, chunk),
        );
        // S3 answers 200 even when it refuses keys: each refusal is an entry here.
        const refused = results.map(refusalCode).filter((c) => c !== null);
        if (refused.length > 0) {
          const codes = [...new Set(refused)].join(',');
          throw new UpstreamError(
            'MEDIA_DELETE_REFUSED',
            `Storage refused to delete ${refused.length} photos (${codes})`,
          );
        }
        removed += chunk.length;
      }
    }
    return removed;
  }

  private async listKeys(prefix: string): Promise<string[]> {
    const keys: string[] = [];
    const stream = this.client.listObjectsV2(this.bucket, prefix, true);
    for await (const item of stream as AsyncIterable<{ name?: string }>) {
      if (item.name) keys.push(item.name);
    }
    return keys;
  }

  private buildKey(kind: MediaKind, ownerId: string): string {
    const prefix = MEDIA_PREFIXES[kind];
    const id = randomUUID();
    return `${prefix}/${ownerId}/${id}.jpg`;
  }

  /** The address of a public (post) image this server stores. */
  publicUrlFor(key: string): string {
    return this.buildPublicUrl(key);
  }

  /** True only for an address of one of this server's public images. */
  isOwnPublicUrl(url: string): boolean {
    const prefix = this.buildPublicUrl('');
    const key = url.startsWith(prefix) ? url.slice(prefix.length) : null;
    const parsed = key === null ? null : parseMediaKey(key);
    return parsed !== null && PUBLIC_PREFIXES.has(parsed.kind);
  }

  private buildPublicUrl(key: string): string {
    const base = this.publicBaseUrl.replace(/\/+$/, '');
    return `${base}/${this.bucket}/${key}`;
  }

  private async ensureBucket() {
    const exists = await this.client
      .bucketExists(this.bucket)
      .catch(() => false);
    if (!exists) {
      await this.client.makeBucket(this.bucket, this.region);
      this.logger.info({ bucket: this.bucket }, 'Created MinIO bucket');
    }
    // Make `posts/*` (and any future PUBLIC_PREFIXES) public-readable.
    const publicPrefixes = Array.from(PUBLIC_PREFIXES).map(
      (k) => MEDIA_PREFIXES[k],
    );
    const policy = {
      Version: '2012-10-17',
      Statement: publicPrefixes.map((p) => ({
        Effect: 'Allow',
        Principal: { AWS: ['*'] },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${this.bucket}/${p}/*`],
      })),
    };
    try {
      await this.client.setBucketPolicy(this.bucket, JSON.stringify(policy));
    } catch (err: unknown) {
      this.logger.warn({ err }, 'Failed to set bucket policy');
    }
  }
}
