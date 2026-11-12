import type { Request } from 'express';

/**
 * The matched route's pattern ("/api/v1/ledger/plants/:id") — what errors and logs
 * name instead of the real URL, which carries ids and query strings.
 */
export function routePattern(req: Pick<Request, 'route' | 'baseUrl'>): string {
  const path = (req.route as { path?: unknown } | undefined)?.path;
  // No route, or only the catch-all middleware route (`/api/v1{/*splat}`): nothing matched.
  if (typeof path !== 'string' || path.includes('*'))
    return '(unmatched route)';
  return `${req.baseUrl ?? ''}${path}`;
}
