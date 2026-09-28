import { describe, expect, it } from 'vitest';
import { formatPlanPrice, PRICING_PLANS, TALK_TO_US } from './pricingPlans';

describe('pricing plans', () => {
  it('never shows placeholder amounts: unpublished prices read "Talk to us"', () => {
    for (const plan of PRICING_PLANS) {
      const { amount } = formatPlanPrice(plan);
      expect(amount === TALK_TO_US || /^\$\d/.test(amount)).toBe(true);
      expect(amount).not.toMatch(/paid|custom/i);
    }
    expect(formatPlanPrice({ monthlyUsd: null })).toEqual({ amount: TALK_TO_US, period: null });
  });
  it('formats real amounts as monthly dollars', () => {
    expect(formatPlanPrice({ monthlyUsd: 49 })).toEqual({ amount: '$49', period: '/ month' });
  });
  it('features exactly one plan', () => {
    expect(PRICING_PLANS.filter((plan) => plan.featured)).toHaveLength(1);
  });
});
