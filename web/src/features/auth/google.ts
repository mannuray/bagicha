import { Capacitor } from '@capacitor/core';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { createContext, useContext } from 'react';

/**
 * How the app gets a Google ID token. On a phone, our own button opens
 * Android's account sheet (signIn). On the website, Google draws its own
 * button (renderButton): Google Identity Services hands over ID tokens only
 * that way reliably. A fake in tests.
 */
export interface GooglePort {
  native: boolean;
  /** Phone: opens the account sheet; the ID token, or 'cancelled' if dismissed. */
  signIn(): Promise<string>;
  /** Website: draws Google's button into `el`; a completed sign-in calls onToken. */
  renderButton(el: HTMLElement, onToken: (idToken: string) => void, opts: { locale: string }): Promise<void>;
}

/** Google's answer when the gardener closed the picker: not an error. */
export const CANCELLED = 'cancelled';

/** The OAuth web client id; empty when the build was made without it. */
export const GOOGLE_CLIENT_ID: string = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

const GIS_SRC = 'https://accounts.google.com/gsi/client';

interface GoogleIdentityServices {
  accounts: {
    id: {
      initialize(config: { client_id: string; callback: (res: { credential?: string }) => void; ux_mode: 'popup' }): void;
      renderButton(el: HTMLElement, options: Record<string, unknown>): void;
    };
  };
}

let gisLoading: Promise<GoogleIdentityServices> | null = null;

/** Loads Google's script once, only when the sign-in screen needs it. */
function loadGis(): Promise<GoogleIdentityServices> {
  gisLoading ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.onload = () => {
      const gis = (window as unknown as { google?: GoogleIdentityServices }).google;
      if (gis) resolve(gis);
      else reject(new Error('Google sign-in did not load'));
    };
    script.onerror = () => {
      gisLoading = null;
      reject(new Error('Google sign-in did not load'));
    };
    document.head.appendChild(script);
  });
  return gisLoading;
}

export const webGoogle: GooglePort = {
  native: false,
  signIn: () => Promise.resolve(CANCELLED),
  async renderButton(el, onToken, { locale }) {
    if (!GOOGLE_CLIENT_ID) throw new Error('Google sign-in is not set up');
    const gis = await loadGis();
    gis.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      ux_mode: 'popup',
      callback: ({ credential }) => {
        if (credential) onToken(credential);
      },
    });
    gis.accounts.id.renderButton(el, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      shape: 'pill',
      text: 'continue_with',
      logo_alignment: 'left',
      width: el.clientWidth || 320,
      locale,
    });
  },
};

const isCancel = (err: unknown) => (err as { code?: unknown } | null)?.code === 'USER_CANCELLED';

/**
 * The phone: Android's account sheet (Credential Manager) through the plugin,
 * asking for a token for the web client id, the one audience the server accepts.
 */
export function nativeGoogle(clientId: string): GooglePort {
  let ready: Promise<void> | null = null;
  return {
    native: true,
    async signIn() {
      if (!clientId) throw new Error('Google sign-in is not set up');
      ready ??= SocialLogin.initialize({ google: { webClientId: clientId } }).catch((err: unknown) => {
        ready = null; // let the next tap try again
        throw err;
      });
      await ready;
      try {
        const { result } = await SocialLogin.login({ provider: 'google', options: {} });
        return ('idToken' in result && result.idToken) || CANCELLED;
      } catch (err) {
        if (isCancel(err)) return CANCELLED;
        throw err;
      }
    },
    renderButton: () => Promise.reject(new Error('The app uses its own button')),
  };
}

const GooglePortContext = createContext<GooglePort>(
  Capacitor.isNativePlatform() ? nativeGoogle(GOOGLE_CLIENT_ID) : webGoogle,
);
export const GooglePortProvider = GooglePortContext.Provider;
export const useGooglePort = () => useContext(GooglePortContext);
