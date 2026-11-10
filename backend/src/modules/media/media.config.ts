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

const PREFIX_TO_KIND = new Map<string, MediaKind>(
  (Object.entries(MEDIA_PREFIXES) as Array<[MediaKind, string]>).map(
    ([kind, prefix]) => [prefix, kind],
  ),
);

const MEDIA_KEY_PATTERN =
  /^([a-z]+)\/([A-Za-z0-9_-]+)\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg)$/;

export interface ParsedMediaKey {
  kind: MediaKind;
  ownerId: string;
  file: string;
}

/** Strictly parses `{prefix}/{ownerId}/{uuid}.jpg`; anything else is null. */
export function parseMediaKey(key: string): ParsedMediaKey | null {
  const match = MEDIA_KEY_PATTERN.exec(key);
  if (!match) return null;
  const kind = PREFIX_TO_KIND.get(match[1]);
  if (!kind) return null;
  return { kind, ownerId: match[2], file: match[3] };
}
