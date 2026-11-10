import type { ReactNode } from 'react';
import { cx } from './cx';

/** The hand-drawn "growth tracker" shape for a big number or badge. */
export function Pebble({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx('pebble-large flex items-center justify-center bg-surface-container-lowest shadow-sm', className)}>
      {children}
    </div>
  );
}
