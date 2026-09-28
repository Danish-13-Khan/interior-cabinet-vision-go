/** Public plan cards. A null price renders "Talk to us" until real amounts are published. */
export type PricingPlan = {
  id: 'designer' | 'professional' | 'company';
  name: string;
  summary: string;
  monthlyUsd: number | null;
  features: readonly string[];
  featured?: boolean;
};

export const PRICING_PLANS: readonly PricingPlan[] = [
  {
    id: 'designer', name: 'Designer', monthlyUsd: null,
    summary: 'For a solo designer turning rooms into priced proposals.',
    features: ['1 seat', 'Unlimited designs and projects', 'Personal price book', 'Frozen, issued quotes'],
  },
  {
    id: 'professional', name: 'Professional', monthlyUsd: null, featured: true,
    summary: 'Adds client history, payment schedules and overdue tracking.',
    features: ['1 seat', 'Payment schedules and ledger', 'Outstanding and overdue reports', 'Full payment history'],
  },
  {
    id: 'company', name: 'Company', monthlyUsd: null,
    summary: 'For studios and factories sharing projects across a team.',
    features: ['Multiple seats and roles', 'Shared price book', 'Approvals and owner dashboard', 'Audit views'],
  },
];

export const TALK_TO_US = 'Talk to us';

export function formatPlanPrice(plan: Pick<PricingPlan, 'monthlyUsd'>): { amount: string; period: string | null } {
  if (plan.monthlyUsd === null || !Number.isFinite(plan.monthlyUsd)) return { amount: TALK_TO_US, period: null };
  const amount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(plan.monthlyUsd);
  return { amount, period: '/ month' };
}
