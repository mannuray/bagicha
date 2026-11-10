import { cx } from './cx';

/** A Material Symbols Outlined glyph (self-hosted font). Decorative unless `label` is given. */
export function Icon({
  name,
  filled = false,
  label,
  className,
}: {
  name: string;
  filled?: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cx('material-symbols-outlined select-none leading-none', className)}
      style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
    >
      {name}
    </span>
  );
}
