import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { Reporter } from '../lib/reporter';

interface State {
  failed: boolean;
}

/**
 * Last line of defence: a recoverable screen instead of a blank page. It sits above
 * the app's providers, so the app hands it the reporter directly.
 */
export class ErrorBoundary extends Component<{ children: ReactNode; report: Reporter }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    this.props.report(error, { componentStack: info.componentStack });
  }

  render() {
    return this.state.failed ? <CrashScreen /> : this.props.children;
  }
}

function CrashScreen() {
  const { t } = useTranslation();
  return (
    <div role="alert" className="mx-auto flex min-h-dvh max-w-[480px] flex-col items-center justify-center gap-4 bg-surface px-5 text-center">
      <h1 className="font-headline text-2xl text-primary">{t('errors.generic')}</h1>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="bg-primary-gradient min-h-11 rounded-full px-4 font-label text-sm font-bold text-on-primary"
      >
        {t('app.reload')}
      </button>
    </div>
  );
}
