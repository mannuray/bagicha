import appBundle from '../app-bundle.json';
import { UpdateGate, updater } from '../features/app-updates';
import { reportError } from '../lib/report-error';
import { ErrorBoundary } from './ErrorBoundary';
import { AppProviders } from './providers';
import { AppRoutes } from './routes';

export default function App() {
  return (
    <ErrorBoundary report={reportError}>
      {/* The screens version baked into this build; scripts/publish-update.mjs raises it. */}
      <UpdateGate port={updater} bundleVersion={appBundle.version}>
        <AppProviders>
          <AppRoutes />
        </AppProviders>
      </UpdateGate>
    </ErrorBoundary>
  );
}
