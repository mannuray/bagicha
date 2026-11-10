import { ErrorBoundary } from './ErrorBoundary';
import { AppProviders } from './providers';
import { AppRoutes } from './routes';

export default function App() {
  return (
    <ErrorBoundary>
      <AppProviders>
        <AppRoutes />
      </AppProviders>
    </ErrorBoundary>
  );
}
