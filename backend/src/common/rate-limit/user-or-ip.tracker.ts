export interface TrackableRequest {
  user?: { id?: string };
  ip?: string;
  ips?: string[];
}

// req.ip respects Express 'trust proxy'; req.ips[0] is whatever the client put in X-Forwarded-For.

/**
 * Signed-in callers are limited per user; everyone else per client IP. The
 * user id comes from the auth guard, or from a token the caller verified.
 */
export function trackerFor(
  req: TrackableRequest,
  verifiedUserId: string | null = null,
): string {
  const userId = req.user?.id ?? verifiedUserId;
  if (userId) return `user:${userId}`;
  const ip = req.ip;
  return `ip:${ip ?? 'unknown'}`;
}
