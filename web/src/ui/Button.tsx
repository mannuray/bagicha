import type { ButtonHTMLAttributes } from 'react';
import { cx } from './cx';

type Variant = 'primary' | 'secondary' | 'tertiary' | 'quiet';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary-gradient text-on-primary shadow-[0_8px_40px_rgba(23,49,36,0.2)]',
  secondary: 'bg-secondary text-on-secondary',
  tertiary: 'bg-transparent text-primary',
  quiet: 'bg-surface-container-lowest text-secondary',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  busy?: boolean;
  block?: boolean;
}

/** River-stone button. While `busy` it is disabled, so an action can't fire twice. */
export function Button({
  variant = 'primary',
  busy = false,
  block = false,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={cx(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2',
        'font-label text-sm font-bold tracking-wide transition-transform duration-200',
        'enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-60',
        VARIANTS[variant],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {busy && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
      )}
      {children}
    </button>
  );
}
