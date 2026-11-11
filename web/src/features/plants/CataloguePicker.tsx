import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cx } from '../../ui';
import { useCatalogueSearch } from './api';
import type { CatalogueItem } from './schemas';

/** Species field with catalogue suggestions; free text is still allowed. */
export function CataloguePicker({
  value,
  onChange,
  onPick,
  error,
  flowers = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onPick: (item: CatalogueItem) => void;
  error?: string | null;
  /** Suggest perennial flowers only (Flower kind), or everything else (Tree kind). */
  flowers?: boolean;
}) {
  const { t } = useTranslation();
  const id = useId();
  const [open, setOpen] = useState(false);
  const search = useCatalogueSearch(open ? value : '');
  const items = (search.data?.items ?? []).filter((item) => (item.plant_type === 'perennial_flower') === flowers);

  return (
    <div className="relative flex flex-col gap-2">
      <label htmlFor={id} className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant">
        {t('plants.form.species')}
      </label>
      <input
        id={id}
        role="combobox"
        aria-expanded={open && items.length > 0}
        aria-controls={`${id}-list`}
        aria-invalid={error ? true : undefined}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={t('plants.form.speciesPlaceholder')}
        className={cx(
          'ghost-border min-h-12 rounded-lg bg-surface-container px-4 py-3 font-body text-base text-on-surface',
          'focus:bg-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary/20',
          error && 'ring-2 ring-error/60',
        )}
      />
      {error && <p className="font-body text-sm text-error">{error}</p>}
      {open && items.length > 0 && (
        <ul id={`${id}-list`} role="listbox" className="absolute top-full z-20 mt-2 w-full overflow-hidden rounded-xl bg-surface-container-lowest shadow-[0_10px_40px_rgba(28,28,25,0.12)]">
          {items.map((item) => (
            <li
              key={item.id}
              role="option"
              aria-selected={false}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onPick(item);
                setOpen(false);
              }}
              className="min-h-11 cursor-pointer px-4 py-3 font-body text-base text-on-surface hover:bg-surface-container-low"
            >
              {item.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
