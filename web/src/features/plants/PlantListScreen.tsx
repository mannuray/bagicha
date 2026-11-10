import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Button, EmptyState, ErrorState, Icon, LoadingState, Screen } from '../../ui';
import { usePlants } from './api';
import type { Plant } from './schemas';

/** Stitch "Orchard Gallery": every tree as a pebble card, newest first. */
export function PlantListScreen() {
  const { t } = useTranslation();
  const [pages, setPages] = useState(1);

  return (
    <Screen nav>
      <header className="flex items-end justify-between px-4 pb-4 pt-6">
        <div>
          <p className="font-label text-xs font-bold uppercase tracking-widest text-secondary">{t('plants.list.kicker')}</p>
          <h1 className="font-headline text-2xl text-primary">{t('plants.list.title')}</h1>
        </div>
        <Link
          to="/plants/new"
          aria-label={t('plants.list.add')}
          className="bg-primary-gradient flex h-12 w-12 items-center justify-center rounded-full text-on-primary shadow-lg"
        >
          <Icon name="add" />
        </Link>
      </header>
      <main className="space-y-3 px-4">
        {Array.from({ length: pages }, (_, i) => (
          <PlantPage key={i} page={i + 1} isLast={i + 1 === pages} onMore={() => setPages((p) => p + 1)} />
        ))}
      </main>
    </Screen>
  );
}

function PlantPage({ page, isLast, onMore }: { page: number; isLast: boolean; onMore: () => void }) {
  const { t } = useTranslation();
  const query = usePlants(page);

  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  if (query.isPending) return <LoadingState />;
  const { items, pagination } = query.data;

  if (page === 1 && items.length === 0) {
    return (
      <EmptyState
        title={t('plants.list.emptyTitle')}
        body={t('plants.list.emptyBody')}
        action={
          <Link to="/plants/new" className="bg-primary-gradient inline-flex min-h-11 items-center rounded-full px-4 font-label text-sm font-bold text-on-primary">
            {t('plants.list.addFirst')}
          </Link>
        }
      />
    );
  }

  return (
    <>
      {items.map((plant) => (
        <PlantCard key={plant.id} plant={plant} />
      ))}
      {isLast && pagination.has_next && (
        <Button variant="tertiary" block onClick={onMore}>
          {t('common.loadMore')}
        </Button>
      )}
    </>
  );
}

function PlantCard({ plant }: { plant: Plant }) {
  const { t } = useTranslation();
  return (
    <Link
      to={`/plants/${plant.id}`}
      className="flex items-center gap-3 rounded-xl bg-surface-container-low p-4 transition-colors hover:bg-surface-container"
    >
      <span className="pebble-large flex h-12 w-12 shrink-0 items-center justify-center bg-primary-gradient text-on-primary">
        <Icon name={plant.record_kind === 'TREE' ? 'park' : plant.record_kind === 'FLOWER' ? 'local_florist' : 'grass'} filled />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-headline text-lg text-primary">{plant.name}</span>
        <span className="block truncate font-body text-sm text-on-surface-variant">
          {[plant.species, plant.variety].filter(Boolean).join(' · ')}
        </span>
        <span className="mt-1 block font-label text-[11px] font-bold uppercase tracking-widest text-secondary">
          {t(`plants.stage.${plant.lifecycle_stage}`)}
        </span>
      </span>
      <Icon name="chevron_right" className="text-outline" />
    </Link>
  );
}
