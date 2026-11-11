import { useTranslation } from 'react-i18next';
import { messageFor } from '../../lib/error-messages';
import { Button, ErrorState, Icon, Screen, TextField, cx, formSubmit } from '../../ui';
import { useStartScan } from './useStartScan';

/** Stitch "Vision Scan": choose identify or diagnose, pick the tree, take a photo. */
export function ScanScreen() {
  const { t } = useTranslation();
  const { plants, mode, setMode, plantId, setPlantId, note, setNote, photo, setPhoto, problem, needTree, setNeedTree, busy, submit } = useStartScan();

  return (
    <Screen nav>
      <header className="px-4 pb-4 pt-6">
        <p className="font-label text-xs font-bold uppercase tracking-widest text-secondary">{t('scan.kicker')}</p>
        <h1 className="font-headline text-2xl text-primary">{t('scan.title')}</h1>
      </header>
      <form onSubmit={formSubmit(submit)} className="space-y-4 px-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          {(['diagnose', 'identify'] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={cx(
                'flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl p-4 text-center transition-colors',
                mode === m ? 'bg-primary-gradient text-on-primary' : 'bg-surface-container-low text-primary',
              )}
            >
              <Icon name={m === 'diagnose' ? 'healing' : 'search'} filled={mode === m} />
              <span className="font-label text-sm font-bold">{t(`scan.mode.${m}`)}</span>
            </button>
          ))}
        </div>

        {mode === 'diagnose' && (
          <div className="space-y-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="scan-tree" className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                {t('scan.whichTree')}
              </label>
              <select
                id="scan-tree"
                value={plantId}
                onChange={(e) => {
                  setPlantId(e.target.value);
                  setNeedTree(false);
                }}
                className="ghost-border min-h-11 rounded-lg bg-surface-container px-3.5 font-body text-base text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">{t('scan.chooseTree')}</option>
                {plants.data?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {needTree && <p className="font-body text-sm text-error">{t('scan.needTree')}</p>}
              {plants.isError && <ErrorState error={plants.error} onRetry={() => void plants.refetch()} />}
            </div>
            <TextField label={t('scan.note')} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        )}

        <label htmlFor="scan-photo" className="pebble-large flex h-40 w-full cursor-pointer flex-col items-center justify-center gap-3 bg-surface-container-low text-primary">
          <Icon name="photo_camera" filled className="text-3xl" />
          <span className="font-label text-sm font-bold">{photo ? photo.name : t('scan.takePhoto')}</span>
        </label>
        <input id="scan-photo" type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />

        {problem !== null && (
          <p role="alert" className="rounded-xl bg-error-container px-4 py-3 font-body text-sm text-on-error-container">
            {messageFor(problem, t)}
          </p>
        )}
        <Button type="submit" block busy={busy} disabled={!photo}>
          {t(`scan.submit.${mode}`)}
        </Button>
      </form>
    </Screen>
  );
}
