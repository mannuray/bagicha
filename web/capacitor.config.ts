import type { CapacitorConfig } from '@capacitor/cli';

// The Android app ships the built web app (dist/) and calls the live API from .env.production.
// Its WebView origin is https://localhost, which the API must allow in WEB_ORIGINS.
const config: CapacitorConfig = {
  appId: 'com.bagicha.app',
  appName: 'Bagicha',
  webDir: 'dist',
};

export default config;
