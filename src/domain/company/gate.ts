/**
 * Company entitlement gates (Phase D).
 * Aligns with canUseCompanyControls / canUsePremiumAudit / canUseSharedOrgPriceBook.
 */

import type { PlanEntitlements } from "../saas/entitlements";

export type CompanyCapability =
  | "companyControls"
  | "sharedOrgPriceBook"
  | "premiumAudit"
  | "approvals"
  | "ownerDashboard";

export function hasCompanyCapability(
  entitlements: PlanEntitlements,
  capability: CompanyCapability,
): boolean {
  if (capability === "sharedOrgPriceBook") {
    return entitlements.canUseSharedOrgPriceBook;
  }
  if (capability === "premiumAudit") {
    return entitlements.canUsePremiumAudit;
  }
  // seats, shared projects, approvals, owner dashboard all need company controls
  return entitlements.canUseCompanyControls;
}

export function assertCompanyCapability(
  entitlements: PlanEntitlements,
  capability: CompanyCapability,
): void {
  if (!hasCompanyCapability(entitlements, capability)) {
    throw new Error(
      `Plan does not include ${capability} (Company plan required).`,
    );
  }
}

export function gateCompanyControls(entitlements: PlanEntitlements): boolean {
  return entitlements.canUseCompanyControls;
}

export function gateSharedOrgPriceBook(entitlements: PlanEntitlements): boolean {
  return entitlements.canUseSharedOrgPriceBook;
}

export function gatePremiumAudit(entitlements: PlanEntitlements): boolean {
  return entitlements.canUsePremiumAudit;
}
