import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { messageFor } from '../../lib/error-messages';
import { Button, ErrorState, Icon, LoadingState, Pill, Screen, TextField, TopBar, formSubmit } from '../../ui';
import saplingPhoto from '../../assets/stitch/add-tree-sapling.jpg';
import { CataloguePicker } from './CataloguePicker';
import { usePlant } from './api';
import { isPlantMissing } from './missing';
import { NotInGarden } from './NotInGarden';
import { fromPlant, type FormState } from './form';
import { usePlantForm } from './usePlantForm';

// Crops come through Want to grow (the crop calendar), not this form.
const KINDS = ['TREE', 'FLOWER'] as const;
const BEARING_CHOICES = [
  { value: 'BEARING', label: 'plants.form.fruitedYes' },
  { value: 'NOT_YET', label: 'plants.form.fruitedNotYet' },
  { value: null, label: 'plants.form.fruitedNotSure' },
] as const;

export function PlantFormScreen() {
  const { id } = useParams();
  const existing = usePlant(id);
  if (id && existing.isError) {
    return (
      <Screen>
        <TopBar />
        <div className="p-4">
          {isPlantMissing(existing.error) ? (
            <NotInGarden />
          ) : (
            <ErrorState error={existing.error} onRetry={() => void existing.refetch()} />
          )}
        </div>
      </Screen>
    );
  }
  if (id && !existing.data) return <Screen><LoadingState /></Screen>;
  return <PlantForm plantId={id} existing={existing.data ? fromPlant(existing.data) : null} />;
}

function PlantForm({ plantId, existing }: { plantId?: string; existing: FormState | null }) {
  const { t } = useTranslation();
  const { form, set, pick, choosePrecision, errors, submit, busy, error } = usePlantForm(plantId, existing);

  const dateLabel = { YEAR: 'plants.form.yearPlanted', MONTH_YEAR: 'plants.form.monthPlanted', EXACT_DATE: 'plants.form.datePlanted' }[form.precision];

  return (
    <Screen>
      <header className="relative flex h-48 items-center justify-center overflow-hidden bg-primary-container pb-6">
        <img src={saplingPhoto} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/30 to-transparent" aria-hidden />
        <div className="absolute left-0 top-0 z-10">
          <TopBar />
        </div>
        <div className="relative flex h-24 w-24 flex-col items-center justify-center rounded-full border border-white/30 bg-white/20 shadow-xl backdrop-blur-xl">
          <Icon name="spa" filled className="text-on-primary" />
          <p className="font-headline text-lg italic text-on-primary">{t('app.name')}</p>
        </div>
      </header>
      <main className="relative z-10 -mt-8 rounded-t-[32px] bg-surface px-4 pb-10 pt-6">
        <h1 className="mb-1 font-headline text-2xl font-bold leading-tight text-primary">
          {plantId ? t('plants.form.editTitle') : t('plants.form.newTitle')}
        </h1>
        <p className="mb-6 font-body text-base text-on-surface-variant">
          {plantId ? t('plants.form.editSubtitle') : t('plants.form.newSubtitle')}
        </p>
        <form onSubmit={formSubmit(submit)} className="space-y-5" noValidate>
          <div className="space-y-2">
            <p className="font-label text-[11px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">{t('plants.form.kind')}</p>
            <div className="flex flex-wrap gap-2">
              {KINDS.map((k) => (
                <Pill key={k} selected={form.record_kind === k} onClick={() => set('record_kind', k)}>
                  {t(`plants.kind.${k}`)}
                </Pill>
              ))}
            </div>
          </div>
          <TextField label={t('plants.form.name')} value={form.name} error={errors.name && t(errors.name)} onChange={(e) => set('name', e.target.value)} placeholder={t('plants.form.namePlaceholder')} />
          <CataloguePicker
            value={form.species}
            error={errors.species && t(errors.species)}
            onChange={(v) => set('species', v)}
            flowers={form.record_kind === 'FLOWER'}
            onPick={pick}
          />
          <TextField label={t('plants.form.variety')} value={form.variety} onChange={(e) => set('variety', e.target.value)} />
          <div className="space-y-2">
            <p className="font-label text-[11px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">{t('plants.form.whenPlanted')}</p>
            <div className="flex flex-wrap gap-2">
              {(['YEAR', 'MONTH_YEAR', 'EXACT_DATE'] as const).map((p) => (
                <Pill key={p} selected={form.precision === p} onClick={() => choosePrecision(p)}>
                  {t(`plants.precision.${p}`)}
                </Pill>
              ))}
            </div>
            <TextField
              label={t(dateLabel)}
              type={form.precision === 'EXACT_DATE' ? 'date' : form.precision === 'MONTH_YEAR' ? 'month' : 'number'}
              inputMode={form.precision === 'YEAR' ? 'numeric' : undefined}
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
              hint={t('plants.form.dateHint')}
            />
          </div>
          {form.record_kind === 'TREE' && (
            <div role="group" aria-labelledby="fruited-label" className="space-y-2">
              <p id="fruited-label" className="font-label text-[11px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                {t('plants.form.fruited')}
              </p>
              <div className="flex flex-wrap gap-2">
                {BEARING_CHOICES.map(({ value, label }) => (
                  <Pill key={label} selected={form.bearing === value} onClick={() => set('bearing', value)}>
                    {t(label)}
                  </Pill>
                ))}
              </div>
              {form.bearing === 'BEARING' && (
                <TextField
                  label={t('plants.form.fruitedSince')}
                  type="number"
                  inputMode="numeric"
                  value={form.since}
                  onChange={(e) => set('since', e.target.value)}
                />
              )}
            </div>
          )}
          {error && (
            <p role="alert" className="text-center font-body text-sm text-error">
              {messageFor(error, t)}
            </p>
          )}
          <Button type="submit" block busy={busy} className="py-3 text-sm uppercase tracking-[0.2em]">
            {plantId ? t('plants.form.saveEdit') : t('plants.form.save')}
          </Button>
        </form>
      </main>
    </Screen>
  );
}

