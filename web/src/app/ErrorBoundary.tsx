import { Component, type ErrorInfo, type ReactNode } from 'react';
import { reportError } from '../lib/report-error';
import i18n from '../lib/i18n';

interface State {
  failed: boolean;
}

/** Last line of defence: a recoverable screen instead of a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    reportError(error, { componentStack: info.componentStack });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="mx-auto flex min-h-dvh max-w-[480px] flex-col items-center justify-center gap-6 bg-surface px-8 text-center">
        <h1 className="font-headline text-3xl text-primary">{i18n.t('errors.generic')}</h1>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="bg-primary-gradient min-h-11 rounded-full px-6 font-label text-sm font-bold text-on-primary"
        >
          {i18n.t('app.reload')}
        </button>
      </div>
    );
  }
}
