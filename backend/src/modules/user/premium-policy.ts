import { SubscriptionTier, User } from '@prisma/client';

export type PremiumFields = Pick<
  User,
  'subscription_tier' | 'premium_expires_at'
>;

/** The one rule for "is this user premium right now". Null expiry = lifetime. */
export function isPremium(user: PremiumFields, now: Date): boolean {
  if (user.subscription_tier !== SubscriptionTier.PREMIUM) return false;
  return user.premium_expires_at === null || user.premium_expires_at > now;
}
