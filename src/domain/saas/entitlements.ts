/**
 * Capability checks for plan SKUs (A0).
 * Callers should use these helpers — not scatter plan-name string checks.
 * Aligns with BUSINESS_PRODUCT_SCOPE §5 and BACKEND book LIC-002 spirit.
 */

import { clampPlanSku, type PlanSku } from "./plans";

export type PlanEntitlements = {
  /** Save designs + project details — every paid plan (Designer+). */
  canSave: boolean;
  /** Edit the personal Price Book (rates + labour + quote defaults) — Designer+. */
  canEditPersonalPriceBook: boolean;
  /** Shared org price book — Company only; product UX is Phase D. */
  canUseSharedOrgPriceBook: boolean;
  /** Freeze issued quotes + basic revisions — every paid plan. */
  canFreezeQuotes: boolean;
  /** Basic client on project (name / contact / project link) — Designer+. */
  canUseBasicClient: boolean;
  /** Consolidated client history — Professional+. */
  canUseClientHistory: boolean;
  /** Payment records / schedules (ledger only; no gateway) — Professional+. */
  canUsePaymentRecords: boolean;
  /** Outstanding / overdue reports — Professional+. */
  canUseOutstandingReports: boolean;
  /** Seats, roles, shared projects, approvals, owner dashboard — Company. */
  canUseCompanyControls: boolean;
  /** Richer audit views / reporting — Company. */
  canUsePremiumAudit: boolean;
};

const DESIGNER_ENTITLEMENTS: PlanEntitlements = {
  canSave: true,
  canEditPersonalPriceBook: true,
  canUseSharedOrgPriceBook: false,
  canFreezeQuotes: true,
  canUseBasicClient: true,
  canUseClientHistory: false,
  canUsePaymentRecords: false,
  canUseOutstandingReports: false,
  canUseCompanyControls: false,
  canUsePremiumAudit: false,
};

const PROFESSIONAL_ENTITLEMENTS: PlanEntitlements = {
  ...DESIGNER_ENTITLEMENTS,
  canUseClientHistory: true,
  canUsePaymentRecords: true,
  canUseOutstandingReports: true,
};

const COMPANY_ENTITLEMENTS: PlanEntitlements = {
  ...PROFESSIONAL_ENTITLEMENTS,
  canUseSharedOrgPriceBook: true,
  canUseCompanyControls: true,
  canUsePremiumAudit: true,
};

const BY_PLAN: Record<PlanSku, PlanEntitlements> = {
  designer: DESIGNER_ENTITLEMENTS,
  professional: PROFESSIONAL_ENTITLEMENTS,
  company: COMPANY_ENTITLEMENTS,
};

/** Entitlements when there is no active paid subscription (local guest / expired). */
export const UNAVAILABLE_ENTITLEMENTS: PlanEntitlements = {
  canSave: false,
  canEditPersonalPriceBook: false,
  canUseSharedOrgPriceBook: false,
  canFreezeQuotes: false,
  canUseBasicClient: false,
  canUseClientHistory: false,
  canUsePaymentRecords: false,
  canUseOutstandingReports: false,
  canUseCompanyControls: false,
  canUsePremiumAudit: false,
};

export function entitlementsForPlan(plan: PlanSku): PlanEntitlements {
  return { ...BY_PLAN[plan] };
}

/**
 * Resolve entitlements from a plan sku (unknown-safe) when subscription is active.
 * Inactive / missing plans yield UNAVAILABLE_ENTITLEMENTS.
 */
export function resolveEntitlements(args: {
  planSku: unknown;
  subscriptionActive: boolean;
}): PlanEntitlements {
  if (!args.subscriptionActive) {
    return { ...UNAVAILABLE_ENTITLEMENTS };
  }
  return entitlementsForPlan(clampPlanSku(args.planSku));
}

export function canSave(plan: PlanSku, subscriptionActive = true): boolean {
  return resolveEntitlements({ planSku: plan, subscriptionActive }).canSave;
}

export function canFreezeQuotes(plan: PlanSku, subscriptionActive = true): boolean {
  return resolveEntitlements({ planSku: plan, subscriptionActive }).canFreezeQuotes;
}

export function canUsePaymentRecords(plan: PlanSku, subscriptionActive = true): boolean {
  return resolveEntitlements({ planSku: plan, subscriptionActive }).canUsePaymentRecords;
}

export function canUseClientHistory(plan: PlanSku, subscriptionActive = true): boolean {
  return resolveEntitlements({ planSku: plan, subscriptionActive }).canUseClientHistory;
}

export function canUseOutstandingReports(plan: PlanSku, subscriptionActive = true): boolean {
  return resolveEntitlements({ planSku: plan, subscriptionActive }).canUseOutstandingReports;
}

