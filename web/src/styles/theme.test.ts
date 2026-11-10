import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const theme = readFileSync(resolve(import.meta.dirname, 'theme.css'), 'utf8');
const sanctuary = readFileSync(resolve(import.meta.dirname, 'sanctuary.css'), 'utf8');

describe('Sanctuary theme (Stitch "Bagicha Heritage")', () => {
  it.each([
    ['primary', '#173124'],
    ['primary-container', '#2d4739'],
    ['secondary', '#9b4425'],
    ['secondary-container', '#fd916b'],
    ['surface', '#fcf9f4'],
    ['surface-container-low', '#f6f3ee'],
    ['surface-container', '#f0ede8'],
    ['surface-container-lowest', '#ffffff'],
    ['on-surface', '#1c1c19'],
    ['on-surface-variant', '#424844'],
    ['outline-variant', '#c2c8c2'],
    ['error', '#ba1a1a'],
  ])('defines --color-%s as %s', (role, hex) => {
    expect(theme).toMatch(new RegExp(`--color-${role}:\\s*${hex};`, 'i'));
  });

  it('uses Noto Serif for headlines and Manrope for body', () => {
    expect(theme).toMatch(/--font-headline:\s*'Noto Serif'/);
    expect(theme).toMatch(/--font-body:\s*'Manrope'/);
  });

  it('defines the organic shapes and glass panel', () => {
    expect(sanctuary).toMatch(/\.pebble-large\s*\{[^}]*border-radius:\s*40% 60% 70% 30% \/ 40% 50% 60% 40%/);
    expect(sanctuary).toMatch(/\.glass-panel\s*\{[^}]*backdrop-filter:\s*blur\(24px\)/);
  });
});
