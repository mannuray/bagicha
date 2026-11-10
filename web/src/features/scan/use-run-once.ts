import { useEffect, useRef } from 'react';

/** Runs `effect` once per mount, even under React StrictMode's double effects. */
export function useRunOnce(effect: () => void): void {
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    effect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per mount by design
  }, []);
}
