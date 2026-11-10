export interface TrackableRequest {
  user?: { id?: string };
  ip?: string;
  ips?: string[];
}

// req.ip respects Express 'trust proxy'; req.ips[0] is whatever the client put in X-Forwarded-For.

/** Signed-in callers are limited per user; everyone else per client IP. */
export function trackerFor(req: TrackableRequest): string {
  if (req.user?.id) return `user:${req.user.id}`;
  const ip = req.ip;
  return `ip:${ip ?? 'unknown'}`;
}
