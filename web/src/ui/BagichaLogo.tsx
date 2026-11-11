import { useId } from 'react';

/** The Bagicha mark: a cream sprout on a forest-green pebble. Same drawing as public/favicon.svg. */
export function BagichaLogo({ size = 56, className }: { size?: number; className?: string }) {
  const gradient = useId();
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="Bagicha logo" className={className}>
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2d4739" />
          <stop offset="1" stopColor="#173124" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill={`url(#${gradient})`} />
      <path d="M32 50V30" stroke="#fcf9f4" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M32 31c0-9 6.5-15 16-15 0 9.5-6.5 15-16 15z" fill="#fcf9f4" />
      <path d="M32 37c0-7-5-12-13-12 0 7.5 5 12 13 12z" fill="#b0cdbb" />
      <path d="M22 50h20" stroke="#c76644" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}
