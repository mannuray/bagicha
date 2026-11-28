import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { BagichaLogo, Button } from '../../ui';
import { decide, parseManifest } from './manifest';
import type { UpdaterPort } from './updater';

type GateState = 'app' | 'updating' | 'blocked';

/**
 * Keeps the phone's screens current. On launch and on resume it reads the control file:
 * an app older than allowed is blocked until it updates from Play; newer screens download
 * quietly and apply next time, or at once with "Updating Budtale…" when forced.
 * Any failure (offline, bad file) leaves the app as it is.
 */
export function UpdateGate({ port, bundleVersion, children }: { port: UpdaterPort; bundleVersion: number; children: ReactNode }) {
  const [state, setState] = useState<GateState>('app');
  const checking = useRef(false);
  const staged = useRef(0);

  useEffect(() => {
    if (!port.native) return;
    void port.ready().catch(() => undefined);

    const check = async () => {
      if (checking.current) return;
      checking.current = true;
      try {
        const native = await port.appVersion();
        const decision = decide(parseManifest(await port.fetchManifest()), { native, bundle: bundleVersion });
        if (decision.kind === 'blocked') {
          setState('blocked');
          await port.playUpdate().catch(() => false);
        } else if (decision.kind === 'update' && decision.version > staged.current) {
          // Already downloaded on an earlier launch: it applies when the app next goes to the background.
          staged.current = Math.max(staged.current, await port.queued().catch(() => 0));
          if (decision.version <= staged.current) return;
          if (decision.force) setState('updating');
          const id = await port.download(decision.version, decision.files);
          staged.current = decision.version;
          await (decision.force ? port.applyNow(id) : port.applyNext(id));
        }
      } catch {
        setState((s) => (s === 'updating' ? 'app' : s));
      } finally {
        checking.current = false;
      }
    };

    void check();
    return port.onResume(() => void check());
  }, [port, bundleVersion]);

  if (state === 'blocked') return <UpdateRequired port={port} />;
  return (
    <>
      {children}
      {state === 'updating' && <Updating />}
    </>
  );
}

function Updating() {
  const { t } = useTranslation();
  return (
    <div role="status" className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-primary text-on-primary">
      <BagichaLogo size={64} />
      <p className="flex items-center gap-2 font-label text-sm font-semibold tracking-wide">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
        {t('appUpdate.updating')}
      </p>
    </div>
  );
}

/** This app version is no longer allowed: Play's update, or the Play listing. */
function UpdateRequired({ port }: { port: UpdaterPort }) {
  const { t } = useTranslation();
  const update = async () => {
    const started = await port.playUpdate().catch(() => false);
    if (!started) await port.openStore().catch(() => undefined);
  };
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-surface px-8 text-center">
      <BagichaLogo size={72} />
      <h1 className="font-headline text-2xl font-bold text-primary">{t('appUpdate.required.title')}</h1>
      <p className="max-w-[20rem] font-body text-sm text-on-surface-variant">{t('appUpdate.required.body')}</p>
      <Button onClick={() => void update()}>{t('appUpdate.required.button')}</Button>
    </main>
  );
}
