import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { messageFor } from '../../lib/error-messages';
import { Button, Chip, ErrorState, LoadingState, Screen, TextField, TopBar } from '../../ui';
import { CataloguePicker } from './CataloguePicker';
import { useCreatePlant, usePlant, useResolvePlant, useUpdatePlant } from './api';
import type { PlantDetail, PlantInput } from './schemas';

type Precision = 'YEAR' | 'MONTH_YEAR' | 'EXACT_DATE';
const KINDS = ['TREE', 'FLOWER', 'CROP'] as const;

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
  if (id && existing.isError) {
    return (
      <Screen>
        <TopBar />
        <div className="p-6">
          <ErrorState error={existing.error} onRetry={() => void existing.refetch()} />
        </div>
      </Screen>
    );
  }
  if (id && !existing.data) return <Screen><LoadingState /></Screen>;
  return <PlantForm plantId={id} initial={existing.data ? fromPlant(existing.data) : emptyForm} />;
}

function PlantForm({ plantId, initial }: { plantId?: string; initial: FormState }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const prefill = plantId ? null : params.get('prefill');
  const resolved = useResolvePlant(prefill);
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
      create.mutate(toInput(form), { onSuccess: (plant) => navigate(`/plants/${plant.id}`, { replace: true }) });
    }
  };

  const dateLabel = { YEAR: 'plants.form.yearPlanted', MONTH_YEAR: 'plants.form.monthPlanted', EXACT_DATE: 'plants.form.datePlanted' }[form.precision];

  return (
    <Screen>
      <TopBar title={plantId ? t('plants.form.editTitle') : t('plants.form.newTitle')} />
      <form onSubmit={submit} className="space-y-6 px-6 pb-16 pt-6" noValidate>
        <TextField label={t('plants.form.name')} value={form.name} error={errors.name} onChange={(e) => set('name', e.target.value)} placeholder={t('plants.form.namePlaceholder')} />
        <CataloguePicker
          value={form.species}
          error={errors.species}
          onChange={(v) => set('species', v)}
          onPick={(item) => setForm((f) => ({ ...f, species: item.species, variety: item.variety ?? f.variety }))}
        />
        <TextField label={t('plants.form.variety')} value={form.variety} onChange={(e) => set('variety', e.target.value)} />
        <div className="space-y-2">
          <p className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant">{t('plants.form.kind')}</p>
          <div className="flex flex-wrap gap-2">
            {KINDS.map((k) => (
              <Chip key={k} selected={form.record_kind === k} onClick={() => set('record_kind', k)}>
                {t(`plants.kind.${k}`)}
              </Chip>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <p className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant">{t('plants.form.whenPlanted')}</p>
          <div className="flex flex-wrap gap-2">
            {(['YEAR', 'MONTH_YEAR', 'EXACT_DATE'] as const).map((p) => (
              <Chip key={p} selected={form.precision === p} onClick={() => setForm((f) => ({ ...f, precision: p, date: '' }))}>
                {t(`plants.precision.${p}`)}
              </Chip>
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
        <Button type="submit" block busy={mutation.isPending}>
          {t('plants.form.save')}
        </Button>
      </form>
    </Screen>
  );
}
