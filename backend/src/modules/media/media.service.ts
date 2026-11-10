import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client as MinioClient } from 'minio';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import {
  IMAGE_MAX_DIMENSION,
  IMAGE_QUALITY,
  MAX_UPLOAD_BYTES,
  MEDIA_BUCKET_DEFAULT,
  MEDIA_PREFIXES,
  MediaKind,
  PUBLIC_PREFIXES,
} from './media.config';

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
  private readonly logger = new Logger(MediaService.name);
  private client!: MinioClient;
  private bucket!: string;
  private publicBaseUrl!: string;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    this.bucket = this.config.get<string>('MEDIA_BUCKET', MEDIA_BUCKET_DEFAULT);
    const endPoint = this.config.get<string>('MEDIA_ENDPOINT', 'localhost');
    const port = parseInt(this.config.get<string>('MEDIA_PORT', '9000'), 10);
    const useSSL = this.config.get<string>('MEDIA_USE_SSL', 'false') === 'true';
    const accessKey = this.config.get<string>('MINIO_ROOT_USER', 'minioadmin');
    const secretKey = this.config.get<string>(
      'MINIO_ROOT_PASSWORD',
      'minioadmin',
    );
    this.publicBaseUrl = this.config.get<string>(
      'MEDIA_PUBLIC_BASE_URL',
      `${useSSL ? 'https' : 'http'}://${endPoint}:${port}`,
    );

    this.client = new MinioClient({
      endPoint,
      port,
      useSSL,
      accessKey,
      secretKey,
    });
    await this.ensureBucket();
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
      throw new BadRequestException('No file uploaded');
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new BadRequestException(
        `File too large (${file.size} bytes); max ${MAX_UPLOAD_BYTES}`,
      );
    }
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException(
        `Unsupported content-type: ${file.mimetype}`,
      );
    }

    const processed = await sharp(file.buffer, { failOn: 'error' })
      .rotate() // honor EXIF orientation, then strip
      .resize({
        width: IMAGE_MAX_DIMENSION,
        height: IMAGE_MAX_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: IMAGE_QUALITY, mozjpeg: true })
      .withMetadata({}) // strip
      .toBuffer({ resolveWithObject: true });

    const key = this.buildKey(kind, ownerId);
    await this.client.putObject(
      this.bucket,
      key,
      processed.data,
      processed.data.length,
      {
        'Content-Type': 'image/jpeg',
        'x-amz-meta-owner-id': ownerId,
        'x-amz-meta-kind': kind,
      },
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

  async getDownloadUrl(key: string, expirySeconds = 60 * 60): Promise<string> {
    return this.client.presignedGetObject(this.bucket, key, expirySeconds);
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
      await this.client.makeBucket(this.bucket);
      this.logger.log(`Created MinIO bucket "${this.bucket}"`);
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
    } catch (err) {
      this.logger.warn(
        `Failed to set bucket policy: ${(err as Error).message}`,
      );
    }
  }
}
