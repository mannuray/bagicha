import { z } from 'zod';

export const REGION_CLUSTERS = [
  'NORTH_INDIA',
  'EAST_INDIA',
  'WEST_INDIA',
  'CENTRAL_INDIA',
  'SOUTH_DECCAN',
  'COASTAL_HUMID',
  'HILLS_COOL',
] as const;
export type RegionCluster = (typeof REGION_CLUSTERS)[number];

export const userSchema = z.object({
  id: z.string(),
  phone_number: z.string(),
  name: z.string().nullable(),
  district: z.string().nullable(),
  region_cluster: z.enum(REGION_CLUSTERS).nullable().default(null),
  garden_types: z.array(z.string()),
  language_pref: z.string(),
  subscription_tier: z.enum(['FREE', 'PREMIUM']),
  premium_expires_at: z.string().nullable(),
  badge_level: z.string(),
  /** Private media key of the profile photo; shown through a signed URL. */
  avatar_key: z.string().nullable().default(null),
});
export type User = z.infer<typeof userSchema>;

export const verifyResponseSchema = z.object({
  access_token: z.string(),
  user: userSchema,
});

/** Premium while its expiry is in the future (null expiry on FREE = not premium). */
export function isPremium(user: User, now: Date): boolean {
  return user.premium_expires_at !== null && new Date(user.premium_expires_at) > now;
}

/** Onboarding is done once we know where the garden is and what grows in it. */
export function isProfileComplete(user: User): boolean {
  return Boolean(user.district && user.region_cluster && user.garden_types.length > 0);
}

/** Someone who already chose a district and garden types finished onboarding before regions existed. */
export function onlyLacksRegion(user: User): boolean {
  return Boolean(user.district && user.garden_types.length > 0 && !user.region_cluster);
}

/** Where an incomplete profile resumes: just the region step for returning users, else the start. */
function onboardingStart(user: User): string {
  return onlyLacksRegion(user) ? '/onboarding/region' : '/onboarding/language';
}

/** The one rule for where a user lands — splash, sign-in and the route guards all use it. */
export function homeFor(user: User | null): string {
  if (!user) return '/login';
  return isProfileComplete(user) ? '/' : onboardingStart(user);
}

export type OnboardingStep = 'language' | 'region' | 'garden';

/** Onboarding order (language → region → garden → home), given the user as just saved. */
export function nextOnboardingStep(user: User, finished: OnboardingStep): string {
  if (finished === 'language') return '/onboarding/region';
  if (finished === 'region') return isProfileComplete(user) ? '/' : '/onboarding/garden';
  return homeFor(user);
}
