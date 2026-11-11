import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { messageFor } from '../../lib/error-messages';
import { Button, ErrorState, Icon, LoadingState, NotInGarden, Pill, Screen, TextField, TopBar, isPlantMissing } from '../../ui';
import saplingPhoto from '../../assets/stitch/add-tree-sapling.jpg';
import { CataloguePicker } from './CataloguePicker';
import { useCreatePlant, usePlant, useResolvePlant, useUpdatePlant } from './api';
import type { PlantDetail, PlantInput } from './schemas';

type Precision = 'YEAR' | 'MONTH_YEAR' | 'EXACT_DATE';
// Crops come through Want to grow (the crop calendar), not this form.
const KINDS = ['TREE', 'FLOWER'] as const;

interface FormState {
  name: string;
  species: string;
  variety: string;
  record_kind: PlantInput['record_kind'];
  precision: Precision;
  date: string;
}

const emptyForm: FormState = { name: '', species: '', variety: '', record_kind: 'TREE', precision: 'YEAR', date: '' };

function fromPlant(p: PlantDetail): FormState {
  const precision: Precision =
    p.planting_date_precision === 'MONTH_YEAR' || p.planting_date_precision === 'EXACT_DATE' ? p.planting_date_precision : 'YEAR';
  return {
    name: p.name,
    species: p.species,
    variety: p.variety ?? '',
    record_kind: p.record_kind,
    precision,
    date: p.planting_date_input ?? '',
  };
}

function toInput(f: FormState): PlantInput {
  return {
    name: f.name.trim(),
    species: f.species.trim(),
    variety: f.variety.trim() || null,
    record_kind: f.record_kind,
    planting_date: f.date.trim() || null,
    planting_date_precision: f.date.trim() ? f.precision : 'UNKNOWN',
  };
}

/** Only fields that actually changed, so an edit never rewrites what the user didn't touch. */
function diff(before: PlantInput, after: PlantInput): Partial<PlantInput> {
  const out: Partial<PlantInput> = {};
  for (const key of Object.keys(after) as Array<keyof PlantInput>) {
    if (after[key] !== before[key]) Object.assign(out, { [key]: after[key] });
  }
  return out;
}

export function PlantFormScreen() {
  const { id } = useParams();
  const existing = usePlant(id);
  // "Perennials like rose or mogra? Add one" opens the form with ?kind=FLOWER.
  const [search] = useSearchParams();
  const newForm: FormState = search.get('kind') === 'FLOWER' ? { ...emptyForm, record_kind: 'FLOWER' } : emptyForm;
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
  return <PlantForm plantId={id} initial={existing.data ? fromPlant(existing.data) : newForm} />;
}

function PlantForm({ plantId, initial }: { plantId?: string; initial: FormState }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const prefill = plantId ? null : params.get('prefill');
  const replacesId = plantId ? null : params.get('replaces');
  const resolved = useResolvePlant(prefill);
  const replaced = usePlant(replacesId ?? undefined);
  const create = useCreatePlant();
  const update = useUpdatePlant(plantId ?? '');
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<{ name?: string; species?: string }>({});

  useEffect(() => {
    const match = resolved.data?.match;
    if (match) {
      setForm((f) => ({ ...f, species: f.species || match.species, variety: f.variety || (match.variety ?? '') }));
    } else if (resolved.data && prefill) {
      setForm((f) => ({ ...f, species: f.species || prefill }));
    }
  }, [resolved.data, prefill]);

  // Planting a replacement: start from the species and variety of the tree it replaces
  // (adjusted once during render, when the old tree arrives).
  const [prefilledFrom, setPrefilledFrom] = useState<string | null>(null);
  if (replaced.data && prefilledFrom !== replaced.data.id) {
    const old = replaced.data;
    setPrefilledFrom(old.id);
    setForm((f) => ({ ...f, species: f.species || old.species, variety: f.variety || (old.variety ?? ''), record_kind: old.record_kind }));
  }

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));
  const mutation = plantId ? update : create;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = {
      name: form.name.trim() ? undefined : t('plants.form.nameRequired'),
      species: form.species.trim() ? undefined : t('plants.form.speciesRequired'),
    };
    setErrors(nextErrors);
    if (nextErrors.name || nextErrors.species) return;
    if (plantId) {
      const changes = diff(toInput(initial), toInput(form));
      if (Object.keys(changes).length === 0) return navigate(`/plants/${plantId}`);
      update.mutate(changes, { onSuccess: () => navigate(`/plants/${plantId}`, { replace: true }) });
    } else {
      create.mutate(
        { ...toInput(form), ...(replacesId ? { replaces_id: replacesId } : {}) },
        { onSuccess: (plant) => navigate(`/plants/${plant.id}`, { replace: true }) },
      );
    }
  };

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
        <form onSubmit={submit} className="space-y-5" noValidate>
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
          <TextField label={t('plants.form.name')} value={form.name} error={errors.name} onChange={(e) => set('name', e.target.value)} placeholder={t('plants.form.namePlaceholder')} />
          <CataloguePicker
            value={form.species}
            error={errors.species}
            onChange={(v) => set('species', v)}
            flowers={form.record_kind === 'FLOWER'}
            onPick={(item) => setForm((f) => ({ ...f, species: item.species, variety: item.variety ?? f.variety }))}
          />
          <TextField label={t('plants.form.variety')} value={form.variety} onChange={(e) => set('variety', e.target.value)} />
          <div className="space-y-2">
            <p className="font-label text-[11px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">{t('plants.form.whenPlanted')}</p>
            <div className="flex flex-wrap gap-2">
              {(['YEAR', 'MONTH_YEAR', 'EXACT_DATE'] as const).map((p) => (
                <Pill key={p} selected={form.precision === p} onClick={() => setForm((f) => ({ ...f, precision: p, date: '' }))}>
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
          {mutation.isError && (
            <p role="alert" className="text-center font-body text-sm text-error">
              {messageFor(mutation.error)}
            </p>
          )}
          <Button type="submit" block busy={mutation.isPending} className="py-3 text-sm uppercase tracking-[0.2em]">
            {plantId ? t('plants.form.saveEdit') : t('plants.form.save')}
          </Button>
        </form>
      </main>
    </Screen>
  );
}

