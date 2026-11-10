export interface TrackableRequest {
  user?: { id?: string };
  ip?: string;
  ips?: string[];
}

/** Signed-in callers are limited per user; everyone else per client IP. */
export function trackerFor(req: TrackableRequest): string {
  if (req.user?.id) return `user:${req.user.id}`;
  const ip = req.ips?.[0] ?? req.ip;
  return `ip:${ip ?? 'unknown'}`;
}
