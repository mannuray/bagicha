import type { ButtonHTMLAttributes } from 'react';
import { cx } from './cx';

/** Selection chip: highest surface when idle, primary when selected. */
export function Chip({
  selected,
  className,
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected: boolean }) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cx(
        'min-h-11 rounded-full px-5 py-2 font-label text-sm font-medium transition-colors',
        selected ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface-variant',
        className,
      )}
      {...rest}
    />
  );
}
