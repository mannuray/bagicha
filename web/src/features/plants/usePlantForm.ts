import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useCreatePlant, usePlant, useResolvePlant, useUpdatePlant } from './api';
import { diff, emptyForm, toInput, validate, type FormErrors, type FormState } from './form';

/**
 * ViewModel for the add / edit tree form: state, prefill (Scan's ?prefill=,
 * a replacement's ?replaces=), validation, create-or-update and where to go next.
 */
export function usePlantForm(plantId: string | undefined, existing: FormState | null) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  // Editing starts from the plant; adding starts blank, on Flower when opened with ?kind=FLOWER
  // ("Perennials like rose or mogra? Add one").
  const [initial] = useState<FormState>(() => existing ?? (params.get('kind') === 'FLOWER' ? { ...emptyForm, record_kind: 'FLOWER' } : emptyForm));
  const prefill = plantId ? null : params.get('prefill');
  const replacesId = plantId ? null : params.get('replaces');
  const resolved = useResolvePlant(prefill);
  const replaced = usePlant(replacesId ?? undefined);
  const create = useCreatePlant();
  const update = useUpdatePlant(plantId ?? '');
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<FormErrors>({});

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
  /** Switching year / month / exact date clears what was typed for the old one. */
  const choosePrecision = (precision: FormState['precision']) => setForm((f) => ({ ...f, precision, date: '' }));
  /** A catalogue pick fills species and (when it has one) variety. */
  const pick = (item: { species: string; variety?: string | null }) =>
    setForm((f) => ({ ...f, species: item.species, variety: item.variety ?? f.variety }));
  const mutation = plantId ? update : create;

  const submit = () => {
    const nextErrors = validate(form);
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

  return { form, set, pick, choosePrecision, errors, submit, busy: mutation.isPending, error: mutation.isError ? mutation.error : null };
}
