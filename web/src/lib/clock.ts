import { createContext, useContext } from 'react';

export interface Clock {
  now(): Date;
}

export const systemClock: Clock = { now: () => new Date() };

/**
 * The app's one clock (coding principles §3: inject time). Pages read "now" once with
 * useNow() and pass it to their sections as a prop; tests provide a fixed clock.
 */
const ClockContext = createContext<Clock>(systemClock);
export const ClockProvider = ClockContext.Provider;

/** "Now", from the provided clock. Call it once per page and pass the value down. */
export function useNow(): Date {
  return useContext(ClockContext).now();
}
