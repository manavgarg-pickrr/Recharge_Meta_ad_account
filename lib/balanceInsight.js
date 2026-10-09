/*
 * Pure logic for turning (balance, yesterdaySpend) into a merchant-facing
 * tier + message. Deliberately has no dependency on the mock data layer so
 * it keeps working unchanged once balance/spend come from real Meta APIs.
 *
 * Health-status wording follows a fixed table (Critical / Low / Moderate /
 * Healthy / Excellent / No Spend Yesterday / No Spend Data / Zero Balance).
 * Each message substitutes the actual estimated day count in place of a
 * fixed range wherever one is available, per that spec.
 */
export function getBalanceInsight(balance, yesterdaySpend, hasSpendHistory) {
  const dayWord = (n) => `${n} day${n === 1 ? '' : 's'}`;

  if (!hasSpendHistory) {
    return {
      tier: 'new',
      badge: 'No Spend Data',
      badgeClass: 'badge-gray',
      message: "We couldn't retrieve yesterday's spend, so the remaining balance duration can't be estimated right now.",
      showDays: false
    };
  }

  if (balance <= 0) {
    return {
      tier: 'critical',
      badge: 'Zero Balance',
      badgeClass: 'badge-red',
      message: 'Your balance is exhausted. Recharge now to resume or avoid interruptions to your ads.',
      showDays: false
    };
  }

  if (yesterdaySpend <= 0) {
    return {
      tier: 'neutral',
      badge: 'No Spend Yesterday',
      badgeClass: 'badge-gray',
      message: "No spend was recorded yesterday, so we can't estimate how long your balance will last based on the latest spend.",
      showDays: false
    };
  }

  const days = balance / yesterdaySpend;

  if (days < 3) {
    const remaining = days < 1 ? 'less than a day' : `approximately ${dayWord(Math.floor(days))} more`;
    return {
      tier: 'critical',
      badge: 'Critical',
      badgeClass: 'badge-red',
      message: `Your balance may last ${remaining} at the current spend rate. Recharge soon to avoid interruptions.`,
      showDays: true,
      days
    };
  }

  if (days < 7) {
    return {
      tier: 'low',
      badge: 'Low',
      badgeClass: 'badge-amber',
      message: `Your balance is running low and may last ${dayWord(Math.round(days))} more at the current spend rate. Consider recharging soon.`,
      showDays: true,
      days
    };
  }

  if (days < 15) {
    return {
      tier: 'moderate',
      badge: 'Moderate',
      badgeClass: 'badge-yellow',
      message: `Your balance looks manageable for now, with approximately ${dayWord(Math.round(days))} of coverage at the current spend rate.`,
      showDays: true,
      days
    };
  }

  if (days < 20) {
    return {
      tier: 'healthy',
      badge: 'Healthy',
      badgeClass: 'badge-green',
      message: `Your balance is in good shape and should cover approximately ${dayWord(Math.round(days))} at the current spend rate.`,
      showDays: true,
      days
    };
  }

  return {
    tier: 'excellent',
    badge: 'Excellent',
    badgeClass: 'badge-green',
    message: 'Your balance is sufficient for 20+ days at the current spend rate. No immediate recharge is needed.',
    showDays: true,
    days
  };
}

// Suggests a recharge amount aimed at covering ~7 days at yesterday's spend,
// rounded to a clean number. Falls back to a flat default when there's no
// reliable spend signal to base a suggestion on.
export function getSuggestedRecharge(yesterdaySpend, hasSpendHistory) {
  if (!hasSpendHistory || yesterdaySpend <= 0) return 5000;
  const raw = yesterdaySpend * 7;
  return Math.ceil(raw / 500) * 500;
}
