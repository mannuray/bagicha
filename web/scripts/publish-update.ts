/**
 * Publishes the current screens as a live update (docs/superpowers/plans/2026-11-28-live-updates.md).
 *
 *   npm run publish-update                     quiet update, applied next time the app opens
 *   npm run publish-update -- --force          urgent: phones apply it at once
 *   npm run publish-update -- --min-native 4   also block apps older than versionCode 4
 *
 * Raises src/app-bundle.json, builds, copies each file into site/app-updates/files/<sha256>,
 * rewrites site/app-updates/android.json and removes files nothing refers to any more.
 * It goes live when the site is deployed (owner's say-so).
 */
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { buildManifest } from '../src/features/app-updates/build-manifest.ts';

const web = join(import.meta.dirname, '..');
const site = join(web, '..', 'site', 'app-updates');
const filesDir = join(site, 'files');
const manifestPath = join(site, 'android.json');
const bundlePath = join(web, 'src', 'app-bundle.json');
const BASE_URL = 'https://budtale.vercel.app/app-updates/files/';

const args = process.argv.slice(2);
const force = args.includes('--force');
const minIdx = args.indexOf('--min-native');

const gradle = readFileSync(join(web, 'android', 'app', 'build.gradle'), 'utf8');
const native = Number(/versionCode\s+(\d+)/.exec(gradle)?.[1]);
if (!native) throw new Error('versionCode not found in android/app/build.gradle');

const previous = existsSync(manifestPath)
  ? (JSON.parse(readFileSync(manifestPath, 'utf8')) as { min_native: number; bundle: { version: number } | null })
  : null;
const minNative = minIdx >= 0 ? Number(args[minIdx + 1]) : (previous?.min_native ?? native);
// Fail before touching anything (buildManifest checks again).
buildManifest([], { version: 1, native, minNative, force, baseUrl: BASE_URL });

const baked = (JSON.parse(readFileSync(bundlePath, 'utf8')) as { version: number }).version;
const version = Math.max(baked, previous?.bundle?.version ?? 0) + 1;
writeFileSync(bundlePath, JSON.stringify({ version }, null, 2) + '\n');

execSync('npm run build', { cwd: web, stdio: 'inherit' });

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

mkdirSync(filesDir, { recursive: true });
const dist = join(web, 'dist');
const files = walk(dist).map((p) => {
  const hash = createHash('sha256').update(readFileSync(p)).digest('hex');
  const target = join(filesDir, hash);
  if (!existsSync(target)) copyFileSync(p, target);
  return { name: relative(dist, p).split(sep).join('/'), hash };
});

const manifest = buildManifest(files, { version, native, minNative, force, baseUrl: BASE_URL });
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

const keep = new Set(files.map((f) => f.hash));
let removed = 0;
for (const name of readdirSync(filesDir)) {
  if (!keep.has(name)) {
    rmSync(join(filesDir, name));
    removed++;
  }
}
console.log(
  `Screens version ${version} for app versionCode ${native}+ (${force ? 'forced' : 'next launch'}); ` +
    `oldest allowed app: ${minNative}. ${files.length} files, ${removed} old files removed. Deploy the site to go live.`,
);
