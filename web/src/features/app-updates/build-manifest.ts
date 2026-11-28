import type { Manifest } from './manifest';

/**
 * The control file for a newly built screens bundle (used by scripts/publish-update.mjs).
 * `native` is the versionCode it was built against; `minNative` the oldest app still allowed.
 */
export function buildManifest(
  files: Array<{ name: string; hash: string }>,
  opts: { version: number; native: number; minNative: number; force: boolean; baseUrl: string },
): Manifest {
  if (opts.minNative > opts.native) {
    throw new Error(`--min-native ${opts.minNative} is newer than the app these screens were built for (${opts.native})`);
  }
  return {
    min_native: opts.minNative,
    bundle: {
      version: opts.version,
      min_native: opts.native,
      force: opts.force,
      files: files.map((f) => ({ file_name: f.name, file_hash: f.hash, download_url: opts.baseUrl + f.hash })),
    },
  };
}
