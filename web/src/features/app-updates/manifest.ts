import { z } from 'zod';

/** One file of a screens bundle, content-addressed by its SHA-256 (Capgo's multi-file download format). */
const fileSchema = z.object({
  file_name: z.string().min(1),
  file_hash: z.string().regex(/^[0-9a-f]{64}$/),
  download_url: z.string().url().startsWith('https://'),
});
export type BundleFile = z.infer<typeof fileSchema>;

/** budtale.vercel.app/app-updates/android.json: the oldest allowed app, and the latest screens. */
const manifestSchema = z.object({
  /** Oldest Android versionCode still allowed to run; older apps must update from Play. */
  min_native: z.number().int().positive(),
  bundle: z
    .object({
      version: z.number().int().positive(),
      /** The versionCode these screens were built against; older apps lack its native parts. */
      min_native: z.number().int().positive(),
      force: z.boolean(),
      files: z.array(fileSchema).min(1),
    })
    .nullable(),
});
export type Manifest = z.infer<typeof manifestSchema>;

/** A control file that doesn't parse is treated as absent: the app keeps running what it has. */
export function parseManifest(raw: unknown): Manifest | null {
  const parsed = manifestSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export type Decision =
  | { kind: 'none' }
  | { kind: 'blocked' }
  | { kind: 'update'; version: number; force: boolean; files: BundleFile[] };

/** What this phone should do, given its app version (`native`) and the screens version it runs (`bundle`). */
export function decide(manifest: Manifest | null, installed: { native: number; bundle: number }): Decision {
  if (!manifest) return { kind: 'none' };
  if (installed.native < manifest.min_native) return { kind: 'blocked' };
  const b = manifest.bundle;
  if (!b || b.version <= installed.bundle || b.min_native > installed.native) return { kind: 'none' };
  return { kind: 'update', version: b.version, force: b.force, files: b.files };
}
