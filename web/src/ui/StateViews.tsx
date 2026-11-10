import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { messageFor } from '../lib/error-messages';
import { Button } from './Button';
import { Icon } from './Icon';

export function LoadingState({ label }: { label?: string }) {
  const { t } = useTranslation();
  return (
    <div role="status" className="flex flex-col items-center gap-3 py-12 text-on-surface-variant">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden />
      <span className="font-body text-sm">{label ?? t('common.loading')}</span>
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl bg-surface-container-low px-6 py-10 text-center">
      <span className="pebble-large flex h-16 w-16 items-center justify-center bg-surface-container-lowest text-primary">
        <Icon name="eco" filled />
      </span>
      <p className="font-headline text-xl text-primary">{title}</p>
      {body && <p className="font-body text-sm text-on-surface-variant">{body}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <div role="alert" className="flex flex-col items-center gap-4 rounded-xl bg-error-container px-6 py-8 text-center text-on-error-container">
      <Icon name="error" />
      <p className="font-body text-base">{messageFor(error)}</p>
      {onRetry && (
        <Button variant="quiet" onClick={onRetry}>
          {t('common.retry')}
        </Button>
      )}
    </div>
  );
}

export interface QueryLike<T> {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  data: T | undefined;
  refetch: () => unknown;
}

/** Every data screen goes through this: loading, error with retry, empty, or content. */
export function QueryState<T>({
  query,
  empty,
  emptyView,
  children,
}: {
  query: QueryLike<T>;
  empty?: (data: T) => boolean;
  emptyView?: ReactNode;
  children: (data: T) => ReactNode;
}) {
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  if (query.isPending || query.data === undefined) return <LoadingState />;
  if (empty?.(query.data) && emptyView) return <>{emptyView}</>;
  return <>{children(query.data)}</>;
}
