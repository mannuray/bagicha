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
import { NotFoundError, ValidationError } from '../../common/errors';
import { decodeSafely } from './image-safety';

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

  private buildKey(kind: MediaKind, ownerId: string): string {
    const prefix = MEDIA_PREFIXES[kind];
    const id = randomUUID();
    return `${prefix}/${ownerId}/${id}.jpg`;
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
