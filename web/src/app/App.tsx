import { reportError } from '../lib/report-error';
import { ErrorBoundary } from './ErrorBoundary';
import { AppProviders } from './providers';
import { AppRoutes } from './routes';

export default function App() {
  return (
    <ErrorBoundary report={reportError}>
      <AppProviders>
        <AppRoutes />
      </AppProviders>
    </ErrorBoundary>
  );
}
