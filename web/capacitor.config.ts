import type { CapacitorConfig } from '@capacitor/cli';

// The Android app ships the built web app (dist/) and calls the live API from .env.production.
// Its WebView origin is https://localhost, which the API must allow in WEB_ORIGINS.
const config: CapacitorConfig = {
  appId: 'com.budtale.app',
  appName: 'Budtale',
  webDir: 'dist',
  // The splash green, so the WebView never flashes white between the launch splash and the web splash.
  backgroundColor: '#173124',
  plugins: {
    // Google only: the other providers would bundle Facebook's SDK, which adds
    // advertising-ID and install-referrer permissions to an app that has no ads.
    SocialLogin: { providers: { google: true, facebook: false, apple: false, twitter: false } },
  },
};

export default config;
