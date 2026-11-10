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
});
export type User = z.infer<typeof userSchema>;

export const verifyResponseSchema = z.object({
  access_token: z.string(),
  user: userSchema,
});

/** Onboarding is done once we know where the garden is and what grows in it. */
export function isProfileComplete(user: User): boolean {
  return Boolean(user.district && user.region_cluster && user.garden_types.length > 0);
}
