import { createContext, useContext, useState, type ReactNode } from 'react';

export type ScanMode = 'identify' | 'diagnose';

export interface PendingScan {
  mode: ScanMode;
  base64: string;
  previewUrl: string | null;
  plantId?: string;
  plantName?: string;
  note?: string;
}

interface ScanStateValue {
  scan: PendingScan | null;
  setScan: (scan: PendingScan | null) => void;
}

const ScanStateContext = createContext<ScanStateValue | null>(null);

/** Keeps the compressed photo between the scan and result screens, so a retry reuses it. */
export function ScanStateProvider({ children }: { children: ReactNode }) {
  const [scan, setScan] = useState<PendingScan | null>(null);
  return <ScanStateContext.Provider value={{ scan, setScan }}>{children}</ScanStateContext.Provider>;
}

export function useScanState(): ScanStateValue {
  const value = useContext(ScanStateContext);
  if (!value) throw new TypeError('useScanState must be used inside <ScanStateProvider>');
  return value;
}
