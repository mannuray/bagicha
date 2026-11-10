import { useCallback, useEffect, useReducer } from 'react';
import { useScanState, type PendingScan, type ScanRequest } from './scan-state';

export interface ScanRequestState<T> {
  data: T | undefined;
  error: unknown;
  pending: boolean;
  /** Sends again after a failure; ignored while a send is in flight. */
  retry: () => void;
}

/**
 * Sends `scan` once — across remounts, back/forward and StrictMode — and
 * returns the shared result. Only an explicit retry sends again.
 */
export function useScanRequest<T>(scan: PendingScan | null, run: (scan: PendingScan) => Promise<T>): ScanRequestState<T> {
  const { requests } = useScanState();
  const [, rerender] = useReducer((n: number) => n + 1, 0);

  const start = useCallback(() => {
    if (!scan || requests.get(scan)?.status === 'pending') return;
    const request: ScanRequest = { status: 'pending', listeners: requests.get(scan)?.listeners ?? new Set() };
    requests.set(scan, request);
    const settle = (patch: Pick<ScanRequest, 'status' | 'data' | 'error'>) => {
      Object.assign(request, patch);
      request.listeners.forEach((notify) => notify());
    };
    run(scan).then(
      (data) => settle({ status: 'success', data }),
      (error: unknown) => settle({ status: 'error', error }),
    );
    request.listeners.forEach((notify) => notify());
    // `run` is recreated each render; the scan object is the identity that matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scan, requests]);

  useEffect(() => {
    if (!scan) return;
    if (!requests.has(scan)) start();
    const listeners = requests.get(scan)?.listeners;
    if (!listeners) return;
    listeners.add(rerender);
    rerender();
    return () => {
      listeners.delete(rerender);
    };
  }, [scan, requests, start]);

  const request = scan ? requests.get(scan) : undefined;
  return {
    data: request?.status === 'success' ? (request.data as T) : undefined,
    error: request?.status === 'error' ? request.error : null,
    pending: request?.status !== 'success' && request?.status !== 'error',
    retry: start,
  };
}
