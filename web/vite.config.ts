import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { existsSync } from 'node:fs';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Push reminders need the Firebase config in the Android app; without it they stay off (see features/reminders/push.ts).
  define: { __FIREBASE_CONFIGURED__: JSON.stringify(existsSync('android/app/google-services.json')) },
  server: { port: 5173, strictPort: true },
});
