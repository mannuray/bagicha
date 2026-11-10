import { useId, type InputHTMLAttributes } from 'react';
import { cx } from './cx';

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | null;
  hint?: string;
}

/** Minimal input: surface-container fill, ghost border, always-visible label. */
export function TextField({ label, error, hint, className, id, ...rest }: TextFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
  return (
    <div className={cx('flex flex-col gap-2', className)}>
      <label htmlFor={inputId} className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cx(
          'ghost-border min-h-12 rounded-lg bg-surface-container px-4 py-3 font-body text-base text-on-surface',
          'placeholder:text-outline focus:bg-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary/20',
          error && 'ring-2 ring-error/60',
        )}
        {...rest}
      />
      {error ? (
        <p id={`${inputId}-error`} className="font-body text-sm text-error">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="font-body text-sm text-outline">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
