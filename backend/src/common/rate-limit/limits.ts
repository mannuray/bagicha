const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

export type RateLimitBucket = 'auth' | 'ai' | 'upload' | 'catalogue';

/**
 * Per-bucket limits (shared across every route in the bucket). Signed-in
 * callers are tracked per user, anonymous callers per IP.
 */
export const RATE_LIMITS: Record<
  RateLimitBucket,
  { limit: number; ttl: number }
> = {
  // OTP request/verify per IP: slows SMS pumping. Brute force is capped per phone in AuthService
  // (OTP burned after 5 wrong guesses). Behind a proxy, set Express 'trust proxy' so req.ip is the client.
  auth: { limit: 5, ttl: MINUTE },
  // Every AI provider call costs money.
  ai: { limit: 20, ttl: HOUR },
  // Image processing (sharp) + storage.
  upload: { limit: 30, ttl: HOUR },
  // Public, unauthenticated catalogue used during onboarding.
  catalogue: { limit: 60, ttl: MINUTE },
};

/** Everything not in a bucket. */
export const DEFAULT_RATE_LIMIT = { limit: 300, ttl: MINUTE };
