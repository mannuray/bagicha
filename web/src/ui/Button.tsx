import type { ButtonHTMLAttributes } from 'react';
import { cx } from './cx';

type Variant = 'primary' | 'secondary' | 'tertiary' | 'quiet';

type Size = 'md' | 'sm';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary-gradient text-on-primary',
  secondary: 'bg-secondary text-on-secondary',
  tertiary: 'bg-transparent text-primary',
  quiet: 'bg-surface-container-lowest text-secondary',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  busy?: boolean;
  block?: boolean;
  /** `sm`: in-card actions (task Mark done / Skip) — shorter, smaller text, softer shadow. */
  size?: Size;
}

const SIZES: Record<Size, string> = {
  md: 'min-h-11 px-5 py-2 text-sm',
  sm: 'min-h-10 px-4 py-1.5 text-xs',
};

/** The primary button's lift: the full river-stone shadow, or a soft one for small buttons. */
const PRIMARY_SHADOW: Record<Size, string> = {
  md: 'shadow-[0_8px_40px_rgba(23,49,36,0.2)]',
  sm: 'shadow-sm',
};

/** River-stone button. While `busy` it is disabled, so an action can't fire twice. */
export function Button({
  variant = 'primary',
  busy = false,
  block = false,
  size = 'md',
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
        'inline-flex items-center justify-center gap-2 rounded-full',
        SIZES[size],
        'font-label font-bold tracking-wide transition-transform duration-200',
        'enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-60',
        VARIANTS[variant],
        variant === 'primary' && PRIMARY_SHADOW[size],
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
