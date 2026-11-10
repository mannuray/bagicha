import type { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { cx } from './cx';

/** Phone-width column (max 480px) centered on desktop; optional bottom navigation. */
export function Screen({
  children,
  nav = false,
  className,
}: {
  children: ReactNode;
  nav?: boolean;
  className?: string;
}) {
  return (
    <div className="min-h-dvh bg-surface">
      <div className={cx('relative mx-auto min-h-dvh w-full max-w-[480px]', nav && 'pb-24', className)}>
        {children}
      </div>
      {nav && <BottomNav />}
    </div>
  );
}
