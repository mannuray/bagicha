import { useCallback, useEffect, useState } from 'react';
import type { PushPermission, PushPort } from './push';

/** The phone's notification permission; null while unknown or on the website. */
export function usePushPermission(port: PushPort) {
  const [permission, setPermission] = useState<PushPermission | null>(null);
  const refresh = useCallback(() => {
    if (!port.native) return;
    void port.permission().then(setPermission, () => setPermission(null));
  }, [port]);
  useEffect(refresh, [refresh]);
  return { permission, setPermission };
}
