import type { User } from '@prisma/client';

/**
 * The signed-in user as clients see it, built field by field: a new column never
 * reaches a client by accident, and coordinates and internal counters stay server-side.
 */
export interface UserView {
  id: string;
  phone_number: string;
  name: string | null;
  district: string | null;
  region_cluster: User['region_cluster'];
  garden_types: string[];
  language_pref: string;
  subscription_tier: User['subscription_tier'];
  premium_expires_at: Date | null;
  badge_level: string;
  avatar_key: string | null;
  /** Set while the account waits to be erased: the app offers to keep it. */
  deletion_due_at: Date | null;
  /** Reminder times, minutes after midnight IST; null = that reminder is off. */
  reminder_morning_min: number | null;
  reminder_evening_min: number | null;
}

export function toUserView(user: User): UserView {
  return {
    id: user.id,
    phone_number: user.phone_number,
    name: user.name,
    district: user.district,
    region_cluster: user.region_cluster,
    garden_types: user.garden_types,
    language_pref: user.language_pref,
    subscription_tier: user.subscription_tier,
    premium_expires_at: user.premium_expires_at,
    badge_level: user.badge_level,
    avatar_key: user.avatar_key,
    deletion_due_at: user.deletion_due_at,
    reminder_morning_min: user.reminder_morning_min,
    reminder_evening_min: user.reminder_evening_min,
  };
}
