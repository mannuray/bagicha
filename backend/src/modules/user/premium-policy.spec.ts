import { SubscriptionTier } from '@prisma/client';
import { isPremium } from './premium-policy';

const NOW = new Date('2026-11-10T00:00:00Z');

describe('isPremium', () => {
  it('treats premium with no expiry as lifetime premium', () => {
    expect(
      isPremium(
        {
          subscription_tier: SubscriptionTier.PREMIUM,
          premium_expires_at: null,
        },
        NOW,
      ),
    ).toBe(true);
  });

  it('honours a future expiry', () => {
    expect(
      isPremium(
        {
          subscription_tier: SubscriptionTier.PREMIUM,
          premium_expires_at: new Date('2026-11-11T00:00:00Z'),
        },
        NOW,
      ),
    ).toBe(true);
  });

  it('drops premium once it has expired', () => {
    expect(
      isPremium(
        {
          subscription_tier: SubscriptionTier.PREMIUM,
          premium_expires_at: new Date('2026-11-09T00:00:00Z'),
        },
        NOW,
      ),
    ).toBe(false);
  });

  it('is never premium on the free tier', () => {
    expect(
      isPremium(
        { subscription_tier: SubscriptionTier.FREE, premium_expires_at: null },
        NOW,
      ),
    ).toBe(false);
  });
});
