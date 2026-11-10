import { config } from 'dotenv';
import { resolve } from 'path';

/** Loads .env.test into every e2e worker (and global setup) before anything else runs. */
export function loadTestEnv(): void {
  const result = config({
    path: resolve(__dirname, '../../.env.test'),
    override: true,
    quiet: true,
  });
  if (result.error) {
    throw new Error(
      'Missing backend/.env.test — copy .env.test.example to .env.test',
    );
  }
}

loadTestEnv();
