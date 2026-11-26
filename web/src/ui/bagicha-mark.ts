/**
 * The Bagicha mark (owner's pick, 2026-11-26): a water drop holding two leaves, on a 64×64 grid.
 * One source for the in-app logo; public/favicon.svg and the Android icons repeat these paths
 * (a test keeps the favicon in step).
 */
export const MARK = {
  drop: 'M32 10C32 10 48 27 48 38.5A16 16 0 0 1 16 38.5C16 27 32 10 32 10Z',
  leafRight: 'M32 47C32 38 36.5 33 43 32C43 41 38.5 46 32 47Z',
  leafLeft: 'M32 47C32 41 28.5 37 23.5 36.5C23.5 42.5 27 46.5 32 47Z',
} as const;

export const MARK_COLORS = {
  pebbleFrom: '#2d4739',
  pebbleTo: '#173124',
  drop: '#fcf9f4',
  leafRight: '#173124',
  leafLeft: '#496455',
} as const;
