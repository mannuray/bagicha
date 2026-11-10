import type { TFunction } from 'i18next';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, ErrorState, LoadingState, Pill } from '../../../ui';
import { useMediaUrl, useTimeline, type JournalEntry } from '../../journal';
import { entryTags, groupByYear, TIMELINE_FILTERS, type EntryTag, type TimelineFilter } from '../record-timeline';
import { humanize, photoKeyOf, shortDate } from './format';

/** Stitch "The Sanctuary Record": the journal grouped by year, filtered on the server. */
export function SanctuaryRecord({ plantId }: { plantId: string }) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<TimelineFilter>(TIMELINE_FILTERS[0]);
  const query = useTimeline(plantId, filter.types);
  return (
    <section aria-label={t('biography.record')} className="space-y-3">
      <h2 className="font-headline text-xl italic text-primary">{t('biography.record')}</h2>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {TIMELINE_FILTERS.map((f) => (
          <Pill key={f.id} selected={filter.id === f.id} onClick={() => setFilter(f)}>
            {t(`biography.filter.${f.id}`)}
          </Pill>
        ))}
      </div>
      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : !query.data ? (
        <LoadingState />
      ) : query.data.items.length === 0 ? (
        <p className="font-body text-sm text-on-surface-variant">{filter.id === 'all' ? t('biography.noEntries') : t('biography.noKind')}</p>
      ) : (
        <ol className="relative space-y-5 pl-6">
          <div className="absolute bottom-0 left-2 top-1 w-px bg-gradient-to-b from-primary/30 via-primary/10 to-transparent" aria-hidden />
          {groupByYear(query.data.items).map((group) => (
            <li key={group.year} className="relative">
              <span className="absolute -left-[1.15rem] top-1 h-3 w-3 rounded-full border-2 border-surface bg-primary" aria-hidden />
              <h3 className="mb-3 font-label text-sm font-bold uppercase tracking-[0.2em] text-secondary">{group.year}</h3>
              <ul className="space-y-3">
                {group.entries.map((entry) => (
                  <RecordCard key={entry.id} entry={entry} />
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
      {query.hasNextPage && (
        <Button variant="quiet" block busy={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>
          {t('biography.earlier')}
        </Button>
      )}
    </section>
  );
}

function RecordCard({ entry }: { entry: JournalEntry }) {
  const { t, i18n } = useTranslation();
  const photo = useMediaUrl(photoKeyOf(entry));
  const tags = entryTags(entry);
  return (
    <li className="flex gap-3 overflow-hidden rounded-xl bg-surface-container-lowest p-3 shadow-[0_10px_40px_rgba(28,28,25,0.03)]">
      {photo.data && (
        <div className="pebble-large h-16 w-16 shrink-0 overflow-hidden">
          <img src={photo.data} alt="" className="h-full w-full object-cover" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-start justify-between gap-2">
          <span className="font-label text-[11px] uppercase tracking-widest text-on-surface-variant">
            {t(`journal.types.${entry.type}`, { defaultValue: humanize(entry.type) })}
          </span>
          <span className="shrink-0 font-label text-xs font-bold text-primary-container">{shortDate(entry.timestamp, i18n.language)}</span>
        </div>
        {entry.content && <p className="line-clamp-3 font-body text-sm text-on-surface">{entry.content}</p>}
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span key={tag.key} className="rounded-full bg-surface-container-highest px-2.5 py-0.5 font-label text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                {tagText(tag, t)}
              </span>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}

function tagText(tag: EntryTag, t: TFunction): string {
  if (tag.key === 'drop') return t('biography.tagDrop', { severity: t(`biography.drop.${tag.values.severity.toUpperCase()}`, { defaultValue: tag.values.severity }) });
  const quality = tag.values.quality;
  return quality
    ? t('biography.tagHarvestQuality', { amount: tag.values.amount, quality: t(`journal.qualities.${quality.toLowerCase()}`, { defaultValue: quality }) })
    : t('biography.tagHarvest', { amount: tag.values.amount });
}
