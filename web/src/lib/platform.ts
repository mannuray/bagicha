import { Capacitor } from '@capacitor/core';

/** True inside the installed phone app, false on the website. */
export const isNativeApp = (): boolean => Capacitor.isNativePlatform();
