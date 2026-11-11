import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
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

/** Object URLs for photo previews (the browser's URL.createObjectURL), injectable for tests. */
export interface PreviewUrls {
  create(blob: Blob): string | null;
  revoke(url: string): void;
}

const browserPreviews: PreviewUrls = {
  create: (blob) => (typeof URL.createObjectURL === 'function' ? URL.createObjectURL(blob) : null),
  revoke: (url) => {
    if (typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(url);
  },
};

interface ScanStateValue {
  scan: PendingScan | null;
  /** Replacing or clearing the scan releases the old photo preview. */
  setScan: (scan: PendingScan | null) => void;
  /** A preview URL for a photo, released when its scan is replaced. */
  previewOf: (blob: Blob) => string | null;
  requests: WeakMap<PendingScan, ScanRequest>;
}

const ScanStateContext = createContext<ScanStateValue | null>(null);

/**
 * Keeps the compressed photo (and its request) between the scan and result
 * screens, so a retry reuses it. Belongs to the signed-in user: signing out forgets it.
 */
export function ScanStateProvider({ children, previews = browserPreviews }: { children: ReactNode; previews?: PreviewUrls }) {
  const { user } = useSession();
  const [stored, setStored] = useState<{ owner: string; scan: PendingScan } | null>(null);
  const [requests] = useState(() => new WeakMap<PendingScan, ScanRequest>());
  const scan = stored && user && stored.owner === user.id ? stored.scan : null;
  const setScan = (next: PendingScan | null) => setStored(next && user ? { owner: user.id, scan: next } : null);
  // A preview lives as long as its scan is the current one for this user: replaced,
  // cleared, signed out or closed, it's released.
  const previewUrl = scan?.previewUrl ?? null;
  useEffect(() => {
    if (!previewUrl) return;
    return () => previews.revoke(previewUrl);
  }, [previewUrl, previews]);
  const previewOf = (blob: Blob) => previews.create(blob);
  return <ScanStateContext.Provider value={{ scan, setScan, previewOf, requests }}>{children}</ScanStateContext.Provider>;
}

export function useScanState(): ScanStateValue {
  const value = useContext(ScanStateContext);
  if (!value) throw new TypeError('useScanState must be used inside <ScanStateProvider>');
  return value;
}
