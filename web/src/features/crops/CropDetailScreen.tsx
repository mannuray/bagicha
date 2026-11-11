import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { messageFor } from '../../lib/error-messages';
import { Button, cx, ErrorState, Icon, LoadingState, Screen, TopBar } from '../../ui';
import { useCropPage } from './useCropPage';
import { CropPhoto } from './CropPhoto';
import { cropFacts, growingSteps, hindiName } from './names';
import type { CropDetail } from './schemas';

type Step = { key: string; title: string; body: string };

/** Everything about one crop, with "Add to Want to grow" and "Start now". */
export function CropDetailScreen() {
  const { t } = useTranslation();
  const { cropId = '' } = useParams();
  const { detail, onList, addToList, startNow, busy, error } = useCropPage(cropId);

  if (detail.isError) return <Screen><TopBar /><ErrorState error={detail.error} onRetry={() => void detail.refetch()} /></Screen>;
  if (!detail.data) return <Screen><TopBar /><LoadingState /></Screen>;
  const crop = detail.data;
  const hindi = hindiName(crop);
  const flower = crop.kind === 'FLOWER';
  const steps: Step[] = growingSteps(crop).map((key) => ({
    key,
    title: t(`crops.steps.${key}.title`),
    body: t(`crops.steps.${key}.body`),
  }));
  const facts = cropFacts(crop).map((f) => ({
    icon: f.icon,
    label: t(f.labelKey),
    value: f.range ? t('crops.detail.days', { min: f.range[0], max: f.range[1] }) : t('crops.detail.aboutDays', { days: f.days }),
  }));

  return (
    <Screen className="pb-32">
      <div className="relative">
        <CropPhoto cropId={crop.id} family={crop.family} name={crop.name} className="h-56 w-full rounded-b-[2.5rem]" />
        <div className="absolute inset-x-0 top-0"><TopBar /></div>
      </div>
      <main className="space-y-5 px-4 pt-4">
        <header className="space-y-1">
          <p className="font-label text-[11px] font-bold uppercase tracking-[0.2em] text-secondary">
            {t(`crops.family.${crop.family}`, { defaultValue: crop.family })} · {t(`crops.methodShort.${crop.method}`)}
          </p>
          <h1 className="font-headline text-3xl font-bold text-primary">{crop.name}</h1>
          {hindi && <p className="font-body text-base text-on-surface-variant">{hindi}</p>}
          {crop.scientific_name && <p className="font-body text-sm italic text-outline">{crop.scientific_name}</p>}
          {crop.description && <p className="pt-1 font-body text-sm text-on-surface">{crop.description}</p>}
        </header>

        <div className="flex items-center gap-3 rounded-[1.5rem] bg-secondary/10 px-4 py-3">
          <Icon name="calendar_month" className="text-secondary" />
          <p className="font-label text-sm font-bold text-secondary">{statusLine(crop, t)}</p>
        </div>

        <ul aria-label={t('crops.detail.glance')} className={cx('grid gap-2', facts.length > 3 ? 'grid-cols-2' : 'grid-cols-3')}>
          {facts.map((f) => (
            <li key={f.label} className="space-y-1 rounded-[1.25rem] bg-surface-container-low p-3">
              <Icon name={f.icon} className="text-primary" />
              <p className="font-label text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{f.label}</p>
              <p className="font-headline text-sm font-bold text-primary">{f.value}</p>
            </li>
          ))}
        </ul>

        <section className="space-y-2">
          <h2 className="font-headline text-xl font-bold text-primary">{t('crops.detail.howItGrows')}</h2>
          <ol aria-label={t('crops.detail.howItGrows')} className="space-y-2">
            {steps.map((s, i) => (
              <li key={s.key} className="flex gap-3 rounded-[1.25rem] bg-surface-container-low p-3">
                <span className="pebble-small flex h-8 w-8 shrink-0 items-center justify-center bg-primary-gradient font-label text-xs font-bold text-on-primary">{i + 1}</span>
                <div className="min-w-0">
                  <h3 className="font-headline text-base font-bold text-primary">{s.title}</h3>
                  <p className="font-body text-xs text-on-surface-variant">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="space-y-1 rounded-[1.5rem] bg-surface-container-low p-4">
          <h2 className="font-headline text-lg font-bold text-primary">{t('crops.detail.howMuch')}</h2>
          <p className="font-body text-sm text-on-surface">{t('crops.guideLine', { plants: crop.guide.plants_for_family_of_4, container: crop.guide.container })}</p>
          <p className="font-body text-xs text-on-surface-variant">{t('crops.detail.spacing', { min: crop.guide.spacing_cm[0], max: crop.guide.spacing_cm[1] })}</p>
        </section>

        <section className="space-y-2 rounded-[1.5rem] bg-surface-container-low p-4">
          <h2 className="font-headline text-lg font-bold text-primary">{t('crops.detail.goodToKnow')}</h2>
          {/* Rotation is a vegetable concern (family pests in the soil); flowers skip it. */}
          {flower ? (
            <p className="font-body text-sm text-on-surface">{t('crops.detail.deadheadTip')}</p>
          ) : (
            <p className="font-body text-sm text-on-surface">
              {t('crops.detail.rotation', {
                family: t(`crops.family.${crop.family}`, { defaultValue: crop.family }),
                mates: t(`crops.familyMates.${crop.family}`, { defaultValue: crop.name.toLowerCase() }),
              })}
            </p>
          )}
          {crop.succession_every_days && <p className="font-body text-sm text-on-surface">{t('crops.detail.succession', { days: crop.succession_every_days })}</p>}
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-[480px] flex-wrap gap-3 bg-surface/90 px-4 pb-6 pt-3 backdrop-blur-xl">
        {error !== null && (
          <p role="alert" className="w-full font-body text-sm text-error">
            {messageFor(error)}
          </p>
        )}
        {onList ? (
          <span className="flex min-h-12 flex-1 items-center justify-center gap-1 font-label text-sm font-bold text-primary">
            <Icon name="check_circle" filled className="text-base" />
            {t('crops.onList')}
          </span>
        ) : (
          <Button variant="quiet" className="flex-1" busy={busy} onClick={addToList}>
            {t('crops.add')}
          </Button>
        )}
        <Button className="flex-1" busy={busy} onClick={startNow}>
          {t('crops.detail.startNow')}
        </Button>
      </div>
    </Screen>
  );
}

function statusLine(crop: CropDetail, t: TFunction): string {
  if (crop.status === 'open') return t('crops.detail.status.open', { window: crop.window_label });
  if (crop.status === 'soon') return t('crops.detail.status.soon', { count: crop.opens_in_days ?? 0, window: crop.window_label });
  if (crop.status === 'later') return t('crops.detail.status.later', { window: crop.window_label });
  return t('crops.detail.status.none');
}
