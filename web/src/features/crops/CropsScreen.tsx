import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useNow } from '../../lib/clock';
import { monthName } from '../../lib/format';
import { ErrorState, Icon, LoadingState, Pill, Screen, TopBar, cx } from '../../ui';
import { useSession } from '../auth';
import { CropPhoto } from './CropPhoto';
import { hindiName } from './names';
import { useCropCalendarView } from './useCropCalendarView';
import type { CropItem } from './schemas';
import { useAddCropToPlan } from './useAddCropToPlan';


/** "What can I sow now?": the region's crops by sowing window, to add to Want to grow. */
export function CropsScreen() {
  const { t, i18n } = useTranslation();
  const { user } = useSession();
  const now = useNow();
  const { calendar, onList, view, chooseView, query, setQuery, filters, toggle, filterList, showLater, setShowLater, open, soon, later } = useCropCalendarView();
  const month = monthName(now, i18n.language);

  return (
    <Screen nav>
      <TopBar title={t('crops.title')} />
      <main className="space-y-5 px-4 pb-6 pt-2">
        <header className="space-y-1">
          <p className="font-label text-[11px] font-bold uppercase tracking-[0.2em] text-secondary">
            {[user?.district, t('crops.monthSowing', { month })].filter(Boolean).join(' · ').toUpperCase()}
          </p>
          {calendar.data && <h2 className="font-headline text-2xl font-bold text-primary">{t('crops.toSowNow', { count: open.length })}</h2>}
        </header>
        <div className="flex gap-2 rounded-full bg-surface-container-low p-1">
          {(['CROP', 'FLOWER'] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => chooseView(v)}
              className={cx(
                'min-h-10 flex-1 rounded-full font-label text-sm font-semibold transition-colors',
                view === v ? 'bg-primary text-on-primary' : 'text-primary/70',
              )}
            >
              {t(v === 'CROP' ? 'crops.view.vegetables' : 'crops.view.flowers')}
            </button>
          ))}
        </div>
        {view === 'FLOWER' && (
          <Link to="/plants/new?kind=FLOWER" className="flex min-h-11 items-center gap-2 font-label text-sm font-bold text-secondary">
            <Icon name="local_florist" />
            {t('crops.view.perennials')}
          </Link>
        )}
        <label className="flex items-center gap-2 rounded-full bg-surface-container-low px-4 py-2.5">
          <Icon name="search" className="text-outline" />
          <input
            type="search"
            aria-label={t('crops.search')}
            placeholder={t('crops.search')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-w-0 flex-1 bg-transparent font-body text-sm text-on-surface outline-none placeholder:text-outline"
          />
        </label>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {filterList.map((f) => (
            <Pill key={f} selected={filters.includes(f)} onClick={() => toggle(f)}>
              {t(`crops.filter.${f}`)}
            </Pill>
          ))}
        </div>
        {calendar.isError ? (
          <ErrorState error={calendar.error} onRetry={() => void calendar.refetch()} />
        ) : !calendar.data ? (
          <LoadingState />
        ) : (
          <>
            {open.length > 0 && (
              <Section label={t('crops.section.open')}>
                <div className="grid grid-cols-2 gap-3">
                  {open.map((crop) => (
                    <CropCard key={crop.id} crop={crop} onList={onList.has(crop.id)} />
                  ))}
                </div>
              </Section>
            )}
            {soon.length > 0 && (
              <Section label={t('crops.section.soon')}>
                <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
                  {soon.map((crop) => (
                    <CropCard key={crop.id} crop={crop} onList={onList.has(crop.id)} className="w-40 shrink-0" />
                  ))}
                </div>
              </Section>
            )}
            {later.length > 0 && (
              <Section label={t('crops.section.later')}>
                {showLater ? (
                  <div className="grid grid-cols-2 gap-3">
                    {later.map((crop) => (
                      <CropCard key={crop.id} crop={crop} onList={onList.has(crop.id)} />
                    ))}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowLater(true)}
                    className="flex w-full items-center gap-2 rounded-[1.25rem] bg-surface-container-low px-4 py-3 text-left font-body text-sm text-on-surface-variant"
                  >
                    <span className="min-w-0 flex-1 truncate">{t('crops.laterList', { names: later.map((c) => c.name).join(', ') })}</span>
                    <Icon name="expand_more" className="text-outline" />
                  </button>
                )}
              </Section>
            )}
          </>
        )}
      </main>
    </Screen>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section aria-label={label} className="space-y-2">
      <h2 className="font-label text-sm font-bold uppercase tracking-[0.1em] text-on-surface-variant">{label}</h2>
      {children}
    </section>
  );
}

function CropCard({ crop, onList, className }: { crop: CropItem; onList: boolean; className?: string }) {
  const { t } = useTranslation();
  const plan = useAddCropToPlan(crop.id, onList);
  const hindi = hindiName(crop);
  const when =
    crop.status === 'soon'
      ? t('crops.opensIn', { count: crop.opens_in_days ?? 0, window: crop.window_label })
      : t('crops.sowWindow', { window: crop.window_label });
  return (
    <article aria-label={crop.name} className={cx('relative overflow-hidden rounded-[1.5rem] bg-surface-container-low', className)}>
      <Link to={`/crops/${crop.id}`} className="block">
        <CropPhoto cropId={crop.id} family={crop.family} name={crop.name} className="aspect-[4/3] w-full" />
        <div className="space-y-0.5 p-3 pr-12">
          <h3 className="font-headline text-base font-bold leading-tight text-primary">{crop.name}</h3>
          {hindi && <p className="font-body text-xs text-on-surface-variant">{hindi}</p>}
          <p className="font-label text-[10px] font-bold uppercase tracking-wider text-secondary">
            {when} · {t(`crops.methodShort.${crop.method}`)}
          </p>
          <p className="font-body text-[11px] text-on-surface-variant">
            {t('crops.firstHarvestShort', { min: crop.days_to_first_harvest[0], max: crop.days_to_first_harvest[1] })}
          </p>
        </div>
      </Link>
      <div className="absolute bottom-3 right-3">
        {plan.onList ? (
          <span role="img" aria-label={t('crops.onList')} title={t('crops.onList')} className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon name="check" />
          </span>
        ) : (
          <button
            type="button"
            aria-label={t('crops.add')}
            disabled={plan.busy}
            onClick={plan.add}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-gradient text-on-primary shadow-md disabled:opacity-60"
          >
            <Icon name="add" />
          </button>
        )}
      </div>
    </article>
  );
}
