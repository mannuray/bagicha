export const PLANS = {
  PREMIUM_MONTHLY: { amountPaise: 29900, days: 30 },
  PREMIUM_YEARLY: { amountPaise: 299900, days: 365 },
} as const;

export type PlanId = keyof typeof PLANS;
export const PLAN_IDS = Object.keys(PLANS) as PlanId[];

export function isPlanId(value: string | undefined): value is PlanId {
  return value !== undefined && value in PLANS;
}
