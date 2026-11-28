import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { AppUpdate, AppUpdateAvailability, AppUpdateResultCode } from '@capawesome/capacitor-app-update';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import type { BundleFile } from './manifest';

/** The control file the app reads on launch and resume (served from site/app-updates/). */
export const MANIFEST_URL = 'https://budtale.vercel.app/app-updates/android.json';

/** What live updates need from the phone; a fake in tests, a no-op on the website. */
export interface UpdaterPort {
  /** False in a browser: the website is always current, there is nothing to update. */
  native: boolean;
  /** The installed Android versionCode. */
  appVersion(): Promise<number>;
  /** Tells the updater these screens started; a bundle that never says so is rolled back. */
  ready(): Promise<void>;
  fetchManifest(): Promise<unknown>;
  /** Downloads only the files this phone lacks; resolves with the new bundle's id. */
  download(version: number, files: BundleFile[]): Promise<string>;
  /** Switches to the bundle now (the WebView reloads). */
  applyNow(id: string): Promise<void>;
  /** Switches the next time the app goes to the background or starts. */
  applyNext(id: string): Promise<void>;
  /** The screens version already downloaded and waiting to apply, or 0. */
  queued(): Promise<number>;
  /** Play's full-screen "update now"; true when the person accepted it. */
  playUpdate(): Promise<boolean>;
  openStore(): Promise<void>;
  onResume(cb: () => void): () => void;
}

const nativeUpdater: UpdaterPort = {
  native: true,
  appVersion: async () => Number((await App.getInfo()).build),
  ready: async () => {
    await CapacitorUpdater.notifyAppReady();
  },
  fetchManifest: async () => {
    const res = await fetch(MANIFEST_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`update check ${res.status}`);
    return res.json();
  },
  download: async (version, files) =>
    (await CapacitorUpdater.download({ url: MANIFEST_URL, version: String(version), manifest: files })).id,
  applyNow: (id) => CapacitorUpdater.set({ id }),
  applyNext: async (id) => {
    await CapacitorUpdater.next({ id });
  },
  queued: async () => Number((await CapacitorUpdater.getNextBundle())?.version ?? 0) || 0,
  playUpdate: async () => {
    const info = await AppUpdate.getAppUpdateInfo();
    if (info.updateAvailability !== AppUpdateAvailability.UPDATE_AVAILABLE || !info.immediateUpdateAllowed) return false;
    return (await AppUpdate.performImmediateUpdate()).code === AppUpdateResultCode.OK;
  },
  openStore: () => AppUpdate.openAppStore({ androidPackageName: 'com.budtale.app' }),
  onResume: (cb) => {
    const handle = App.addListener('resume', cb);
    return () => void handle.then((h) => h.remove());
  },
};

const webUpdater: UpdaterPort = {
  native: false,
  appVersion: () => Promise.resolve(0),
  ready: () => Promise.resolve(),
  fetchManifest: () => Promise.resolve(null),
  download: () => Promise.reject(new Error('no live updates on the website')),
  applyNow: () => Promise.resolve(),
  applyNext: () => Promise.resolve(),
  queued: () => Promise.resolve(0),
  playUpdate: () => Promise.resolve(false),
  openStore: () => Promise.resolve(),
  onResume: () => () => undefined,
};

export const updater: UpdaterPort = Capacitor.isNativePlatform() ? nativeUpdater : webUpdater;
