-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'PREMIUM');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "premium_expires_at" TIMESTAMP(3),
ADD COLUMN     "subscription_tier" "SubscriptionTier" NOT NULL DEFAULT 'FREE';

-- Data: anyone the old webhook marked "Rooted" was a paying user, never an earned rank.
UPDATE "users"
SET "subscription_tier" = 'PREMIUM', "premium_expires_at" = NULL, "badge_level" = 'Seedling'
WHERE "badge_level" = 'Rooted';
