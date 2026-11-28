import { describe, expect, it } from 'vitest';
import { decide, parseManifest } from './manifest';

const file = { file_name: 'index.html', file_hash: 'a'.repeat(64), download_url: 'https://budtale.vercel.app/app-updates/files/' + 'a'.repeat(64) };
const manifest = (over: Record<string, unknown> = {}, bundle: Record<string, unknown> | null = {}) => ({
  min_native: 3,
  bundle: bundle === null ? null : { version: 7, min_native: 3, force: false, files: [file], ...bundle },
  ...over,
});

describe('live update decision', () => {
  it('blocks an app older than the oldest allowed version', () => {
    expect(decide(parseManifest(manifest({ min_native: 4 })), { native: 3, bundle: 5 })).toEqual({ kind: 'blocked' });
  });

  it('downloads newer screens built for this app version', () => {
    expect(decide(parseManifest(manifest()), { native: 3, bundle: 5 })).toEqual({ kind: 'update', version: 7, force: false, files: [file] });
  });

  it('passes the force flag through', () => {
    expect(decide(parseManifest(manifest({}, { force: true })), { native: 3, bundle: 5 })).toMatchObject({ kind: 'update', force: true });
  });

  it('does nothing when the screens are already current', () => {
    expect(decide(parseManifest(manifest()), { native: 3, bundle: 7 })).toEqual({ kind: 'none' });
  });

  it('never goes back to older screens', () => {
    expect(decide(parseManifest(manifest()), { native: 3, bundle: 9 })).toEqual({ kind: 'none' });
  });

  it('ignores screens built for a newer app than this one', () => {
    expect(decide(parseManifest(manifest({ min_native: 3 }, { min_native: 4 })), { native: 3, bundle: 5 })).toEqual({ kind: 'none' });
  });

  it('works with no bundle published yet', () => {
    expect(decide(parseManifest(manifest({}, null)), { native: 3, bundle: 1 })).toEqual({ kind: 'none' });
  });

  it('treats a broken control file as nothing to do', () => {
    expect(decide(parseManifest({ min_native: 'x' }), { native: 3, bundle: 1 })).toEqual({ kind: 'none' });
    expect(decide(parseManifest(manifest({}, { files: [{ ...file, file_hash: null }] })), { native: 3, bundle: 1 })).toEqual({ kind: 'none' });
  });

  it('refuses files from anywhere but https', () => {
    const http = { ...file, download_url: 'http://budtale.vercel.app/x' };
    expect(decide(parseManifest(manifest({}, { files: [http] })), { native: 3, bundle: 1 })).toEqual({ kind: 'none' });
  });
});
