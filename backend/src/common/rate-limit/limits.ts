const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

export type RateLimitBucket = 'auth' | 'ai' | 'upload' | 'catalogue' | 'write';

/**
 * Per-bucket limits (shared across every route in the bucket). Signed-in
 * callers are tracked per user (by the auth guard, or by a verified bearer
 * token in the global guard), anonymous callers per IP.
 */
export const RATE_LIMITS: Record<
  RateLimitBucket,
  { limit: number; ttl: number }
> = {
  // Google sign-in per IP: slows account-creation spam (Google verifies who signs in, so there
  // is nothing to guess). Room for many phones behind one shared mobile-carrier address.
  // Behind a proxy, set Express 'trust proxy' so req.ip is the client.
  auth: { limit: 20, ttl: MINUTE },
  // Every AI provider call costs money.
  ai: { limit: 20, ttl: HOUR },
  // Image processing (sharp) + storage.
  upload: { limit: 30, ttl: HOUR },
  // Public, unauthenticated catalogue used during onboarding.
  catalogue: { limit: 60, ttl: MINUTE },
  // What other people read: community posts, comments, reports, chat messages.
  write: { limit: 30, ttl: MINUTE },
};

/** Everything not in a bucket. */
export const DEFAULT_RATE_LIMIT = { limit: 300, ttl: MINUTE };
