import { useVisionApi } from './api';
import { diagnosePayload, identifyPayload } from './scan-payload';
import { useScanState, type ScanMode } from './scan-state';
import { useScanRequest } from './use-scan-request';

/**
 * ViewModel for a scan result screen: the pending scan of this mode (null means go
 * back to Scan) and its request, sent once and shared across remounts.
 */
function useScanResult<T>(mode: ScanMode, send: (vision: ReturnType<typeof useVisionApi>, scan: NonNullable<ReturnType<typeof useScanState>['scan']>) => Promise<T>) {
  const { scan } = useScanState();
  const vision = useVisionApi();
  const mine = scan?.mode === mode ? scan : null;
  const request = useScanRequest(mine, (s) => send(vision, s));
  return { scan: mine, ...request };
}

export const useDiagnoseResult = () => useScanResult('diagnose', (vision, scan) => vision.diagnose(diagnosePayload(scan)));
export const useIdentifyResult = () => useScanResult('identify', (vision, scan) => vision.identify(identifyPayload(scan)));
