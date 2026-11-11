import { createContext, useContext } from 'react';

/** Where unexpected failures go (lib/report-error in the app; a spy in tests). */
export type Reporter = (err: unknown, context?: Record<string, unknown>) => void;

const ReporterContext = createContext<Reporter | null>(null);
export const ReporterProvider = ReporterContext.Provider;

export function useReport(): Reporter {
  const report = useContext(ReporterContext);
  if (!report) throw new TypeError('useReport must be used inside <ReporterProvider>');
  return report;
}
