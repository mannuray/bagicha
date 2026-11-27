import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const MIGRATION = join(
  __dirname,
  '../../../prisma/migrations/20261128100000_google_sign_in/migration.sql',
);

/** SQL statements only: comments describe what a later release does. */
const statements = () =>
  readFileSync(MIGRATION, 'utf8')
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n');

/**
 * The server running before the deploy still reads users.phone_number, so the
 * Google sign-in release only adds: the phone column goes in a later release,
 * once nothing reads it and there is no need to roll back.
 */
describe('Google sign-in migration', () => {
  it('drops nothing, so the server still running keeps working', () => {
    expect(statements()).not.toMatch(/\bDROP\s+(COLUMN|INDEX|TABLE)\b/i);
  });

  it('lets new Google accounts have no phone number', () => {
    expect(statements()).toMatch(
      /ALTER COLUMN\s+"phone_number"\s+DROP NOT NULL/i,
    );
  });
});
