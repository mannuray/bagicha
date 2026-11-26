import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useSession } from '../auth';
import { useRegisterDevice } from './api';
import { usePushPort } from './push';

/** The only screen a reminder may open. */
const TAP_ROUTES = new Set(['/tasks']);

/**
 * On the phone, for a signed-in gardener: creates the reminders channel,
 * registers with FCM when permission was already given (never asks by
 * itself), sends the token to the server, and opens the tasks screen when a
 * reminder is tapped.
 */
function usePushRegistration(): void {
  const port = usePushPort();
  const navigate = useNavigate();
  const { user } = useSession();
  const { mutate: registerDevice } = useRegisterDevice();
  const listening = useRef(false);
  const userId = user?.id;

  useEffect(() => {
    if (!port.native || listening.current) return;
    listening.current = true;
    port.onToken((token) => registerDevice(token));
    port.onTap((route) => {
      if (TAP_ROUTES.has(route)) void navigate(route);
    });
  }, [port, navigate, registerDevice]);

  useEffect(() => {
    if (!port.native || !userId) return;
    void (async () => {
      await port.ensureChannel();
      if ((await port.permission()) === 'granted') await port.register();
    })().catch(() => undefined); // No Firebase config on this build: reminders simply stay off.
  }, [port, userId]);
}

export function PushRegistration() {
  usePushRegistration();
  return null;
}
