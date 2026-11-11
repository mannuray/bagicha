/** The "Start growing" sheet as data: its steps, what it logs, the sun warning (no React). */

export type StartPath = 'seeds' | 'seedlings' | 'transplant';
export type StartMethod = 'NURSERY' | 'DIRECT';
export type StartStep = 'path' | 'method' | 'confirm' | 'place';

/**
 * Where the sheet is: path → method (nursery crops from seed only) → place.
 * A nursery tray needs no place ("confirm"); transplanting is just the place.
 */
export function startProgress(input: { path: StartPath | null; method: StartMethod | null; nurseryCrop: boolean }) {
  const { path, method, nurseryCrop } = input;
  const askMethod = path === 'seeds' && nurseryCrop;
  const step: StartStep = !path ? 'path' : askMethod && method === null ? 'method' : askMethod && method === 'NURSERY' ? 'confirm' : 'place';
  const steps: Array<Exclude<StartStep, 'confirm'>> =
    path === 'transplant'
      ? ['place']
      : ['path', ...(nurseryCrop && path !== 'seedlings' ? (['method'] as const) : []), ...(method === 'NURSERY' && path === 'seeds' ? [] : (['place'] as const))];
  const at = Math.max(0, steps.indexOf(step === 'confirm' ? 'method' : step));
  return { step, steps, at };
}

/** What starting logs: seeds are a sowing (with its method), seedlings a transplant. */
export function startEntry(path: StartPath | null, method: StartMethod | null, placeId: string | null) {
  const metadata = placeId ? { place_id: placeId } : {};
  return path === 'seeds'
    ? { type: 'SOWING' as const, metadata: { method: method ?? 'DIRECT', ...metadata } }
    : { type: 'TRANSPLANTING' as const, metadata };
}

/** A full-sun crop placed somewhere with less sun. */
export function sunMismatch(cropSun: string, placeSun: string | null | undefined): boolean {
  return cropSun === 'FULL' && (placeSun === 'PARTIAL' || placeSun === 'SHADE');
}
