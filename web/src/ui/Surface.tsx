import type { HTMLAttributes } from 'react';
import { cx } from './cx';

const LEVELS = {
  base: 'bg-surface',
  low: 'bg-surface-container-low',
  mid: 'bg-surface-container',
  lowest: 'bg-surface-container-lowest',
} as const;

const SHAPES = {
  xl: 'rounded-xl',
  lg: 'rounded-lg',
  pebble: 'pebble-large',
  pebbleSmall: 'pebble-small',
} as const;

/** A card defined by a background shift, never a border (the "no-line" rule). */
export function Surface({
  level = 'low',
  shape = 'xl',
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { level?: keyof typeof LEVELS; shape?: keyof typeof SHAPES }) {
  return <div className={cx(LEVELS[level], SHAPES[shape], className)} {...rest} />;
}
