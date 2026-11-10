import type { ReactNode } from 'react';
import { cx } from './cx';

/** Stitch's uppercase choice pill (add tree, log a moment). */
export function Pill({ selected, onClick, children, className }: { selected: boolean; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cx(
        'min-h-11 shrink-0 rounded-full px-5 font-label text-xs font-bold uppercase tracking-wider transition-colors duration-150',
        selected ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-primary/70 hover:bg-surface-variant',
        className,
      )}
    >
      {children}
    </button>
  );
}
