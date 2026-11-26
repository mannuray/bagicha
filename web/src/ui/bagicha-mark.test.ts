import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MARK } from './bagicha-mark';

const favicon = readFileSync(resolve(__dirname, '../../public/favicon.svg'), 'utf8');

describe('Bagicha mark', () => {
  it('the favicon draws the same drop and leaves as the in-app logo', () => {
    for (const d of [MARK.drop, MARK.leafRight, MARK.leafLeft]) expect(favicon).toContain(`d="${d}"`);
  });
});
