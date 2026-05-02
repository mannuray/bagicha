export const MEDIA_BUCKET_DEFAULT = 'bagicha-media';

export const MEDIA_PREFIXES = {
  post: 'posts',
  vision: 'vision',
  journal: 'journal',
} as const;

export type MediaKind = keyof typeof MEDIA_PREFIXES;

export const MEDIA_KINDS = Object.keys(MEDIA_PREFIXES) as MediaKind[];

// Public-read prefixes — anyone with the URL can fetch.
// Private prefixes are served via presigned GET URLs (see MediaService.getDownloadUrl).
export const PUBLIC_PREFIXES: Set<MediaKind> = new Set(['post']);

// Sharp processing knobs. Mobile cameras already produce reasonable JPEGs;
// we re-encode for consistency, strip EXIF, and cap the long edge.
export const IMAGE_MAX_DIMENSION = 2048;
export const IMAGE_QUALITY = 82;
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB raw input
