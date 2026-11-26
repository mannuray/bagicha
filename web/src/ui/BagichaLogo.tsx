import { useId } from 'react';
import { MARK, MARK_COLORS as C } from './bagicha-mark';

/** The Bagicha mark: a cream water drop holding two leaves, on a forest-green pebble. Same drawing as public/favicon.svg. */
export function BagichaLogo({ size = 56, className }: { size?: number; className?: string }) {
  const gradient = useId();
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="Bagicha logo" className={className}>
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={C.pebbleFrom} />
          <stop offset="1" stopColor={C.pebbleTo} />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill={`url(#${gradient})`} />
      <path d={MARK.drop} fill={C.drop} />
      <path d={MARK.leafRight} fill={C.leafRight} />
      <path d={MARK.leafLeft} fill={C.leafLeft} />
    </svg>
  );
}
