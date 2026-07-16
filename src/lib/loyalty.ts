// Pure loyalty maths — no database access, so it is easy to reason about and test.

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "collected",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface LoyaltyConfig {
  loyaltyStampsPerReward: number;
  pointsPerPound: number;
}

export interface EarnableItem {
  priceCents: number;
  quantity: number;
  earnsStamp: boolean;
}

export interface LoyaltyBalance {
  stamps: number;
  points: number;
  rewards: number;
}

export interface LoyaltyOutcome {
  stampsEarned: number;
  pointsEarned: number;
  rewardsEarned: number;
  /** Balance after applying the earnings. */
  next: LoyaltyBalance;
}

/**
 * Given a shop's loyalty config, the items on an order, and the customer's
 * current balance, work out what they earn and their resulting balance.
 *
 *  * One stamp is earned per eligible item (respecting quantity).
 *  * Points accrue at `pointsPerPound` per whole penny spent, pro-rata.
 *  * Whenever stamps reach the reward threshold, a reward is banked and the
 *    stamp counter rolls over.
 */
export function applyEarnings(
  config: LoyaltyConfig,
  items: EarnableItem[],
  current: LoyaltyBalance,
): LoyaltyOutcome {
  const stampsEarned = items.reduce(
    (n, i) => n + (i.earnsStamp ? i.quantity : 0),
    0,
  );

  const subtotalCents = items.reduce((n, i) => n + i.priceCents * i.quantity, 0);
  const pointsEarned = Math.floor((subtotalCents * config.pointsPerPound) / 100);

  const perReward = Math.max(1, config.loyaltyStampsPerReward);
  const totalStamps = current.stamps + stampsEarned;
  const rewardsEarned = Math.floor(totalStamps / perReward);
  const remainingStamps = totalStamps % perReward;

  return {
    stampsEarned,
    pointsEarned,
    rewardsEarned,
    next: {
      stamps: remainingStamps,
      points: current.points + pointsEarned,
      rewards: current.rewards + rewardsEarned,
    },
  };
}
