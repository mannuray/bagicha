import { createContext, useContext, useState, type ReactNode } from 'react';
import { useSession } from '../auth';

export type ScanMode = 'identify' | 'diagnose';

export interface PendingScan {
  mode: ScanMode;
  base64: string;
  previewUrl: string | null;
  plantId?: string;
  plantName?: string;
  note?: string;
}

/** One send of a scan; outlives the result screen so going back and forth doesn't re-send. */
export interface ScanRequest {
  status: 'pending' | 'success' | 'error';
  data?: unknown;
  error?: unknown;
  listeners: Set<() => void>;
}

interface ScanStateValue {
  scan: PendingScan | null;
  setScan: (scan: PendingScan | null) => void;
  requests: WeakMap<PendingScan, ScanRequest>;
}

const ScanStateContext = createContext<ScanStateValue | null>(null);

/**
 * Keeps the compressed photo (and its request) between the scan and result
 * screens, so a retry reuses it. Belongs to the signed-in user: signing out forgets it.
 */
export function ScanStateProvider({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const [stored, setStored] = useState<{ owner: string; scan: PendingScan } | null>(null);
  const [requests] = useState(() => new WeakMap<PendingScan, ScanRequest>());
  const scan = stored && user && stored.owner === user.id ? stored.scan : null;
  const setScan = (next: PendingScan | null) => setStored(next && user ? { owner: user.id, scan: next } : null);
  return <ScanStateContext.Provider value={{ scan, setScan, requests }}>{children}</ScanStateContext.Provider>;
}

export function useScanState(): ScanStateValue {
  const value = useContext(ScanStateContext);
  if (!value) throw new TypeError('useScanState must be used inside <ScanStateProvider>');
  return value;
}
