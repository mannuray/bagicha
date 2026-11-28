import { describe, expect, it } from 'vitest';
import { buildManifest } from './build-manifest';
import { decide, parseManifest } from './manifest';

const h = (c: string) => c.repeat(64);
const files = [
  { name: 'index.html', hash: h('a') },
  { name: 'assets/index-x.js', hash: h('b') },
];
const base = 'https://budtale.vercel.app/app-updates/files/';

describe('buildManifest', () => {
  it('lists every file by hash under the files folder, with the app version it was built against', () => {
    const m = buildManifest(files, { version: 8, native: 3, minNative: 3, force: false, baseUrl: base });
    expect(m).toEqual({
      min_native: 3,
      bundle: {
        version: 8,
        min_native: 3,
        force: false,
        files: [
          { file_name: 'index.html', file_hash: h('a'), download_url: base + h('a') },
          { file_name: 'assets/index-x.js', file_hash: h('b'), download_url: base + h('b') },
        ],
      },
    });
  });

  it('produces a file the app accepts and acts on', () => {
    const m = buildManifest(files, { version: 8, native: 3, minNative: 3, force: true, baseUrl: base });
    expect(decide(parseManifest(m), { native: 3, bundle: 7 })).toMatchObject({ kind: 'update', version: 8, force: true });
  });

  it('refuses to require a newer app than the one the screens were built for', () => {
    expect(() => buildManifest(files, { version: 8, native: 3, minNative: 4, force: false, baseUrl: base })).toThrow(/min-native/i);
  });
});
