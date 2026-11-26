import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { createContext, useContext } from 'react';

export type PushPermission = 'granted' | 'denied' | 'prompt';

/** What the app needs from the phone's push service; a fake in tests, a no-op on the website. */
export interface PushPort {
  /** False in a browser: no pushes, no permission, nothing to show. */
  native: boolean;
  permission(): Promise<PushPermission>;
  /** Shows the system prompt. */
  request(): Promise<'granted' | 'denied'>;
  /** Asks FCM for this phone's token; it arrives through onToken. */
  register(): Promise<void>;
  onToken(cb: (token: string) => void): void;
  /** A reminder was tapped; the route it carries. */
  onTap(cb: (route: string) => void): void;
  ensureChannel(): Promise<void>;
}

/** The Android channel reminders arrive on; the id matches the server's REMINDER_CHANNEL_ID. */
export const CHANNEL = { id: 'garden-reminders', name: 'Garden reminders', importance: 4 } as const;

const toPermission = (state: string): PushPermission =>
  state === 'granted' ? 'granted' : state === 'denied' ? 'denied' : 'prompt';

const noop = () => undefined;
const webPush: PushPort = {
  native: false,
  permission: () => Promise.resolve('denied'),
  request: () => Promise.resolve('denied'),
  register: () => Promise.resolve(),
  onToken: noop,
  onTap: noop,
  ensureChannel: () => Promise.resolve(),
};

const nativePush: PushPort = {
  native: true,
  permission: async () => toPermission((await PushNotifications.checkPermissions()).receive),
  request: async () => ((await PushNotifications.requestPermissions()).receive === 'granted' ? 'granted' : 'denied'),
  register: () => PushNotifications.register(),
  onToken: (cb) => {
    void PushNotifications.addListener('registration', (t) => cb(t.value));
  },
  onTap: (cb) => {
    void PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      const route: unknown = (action.notification.data as { route?: unknown } | undefined)?.route;
      if (typeof route === 'string') cb(route);
    });
  },
  ensureChannel: () => PushNotifications.createChannel({ ...CHANNEL }),
};

export const capacitorPush: PushPort = Capacitor.isNativePlatform() ? nativePush : webPush;

const PushPortContext = createContext<PushPort>(capacitorPush);
export const PushPortProvider = PushPortContext.Provider;
export const usePushPort = () => useContext(PushPortContext);

/** Asks for permission and, if given, registers the phone. True when granted. */
export async function enablePush(port: PushPort): Promise<boolean> {
  if ((await port.request()) !== 'granted') return false;
  await port.register();
  return true;
}
