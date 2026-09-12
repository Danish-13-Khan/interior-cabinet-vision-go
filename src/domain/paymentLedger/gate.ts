import type { PlanEntitlements } from "../saas/entitlements";

export type PaymentCapability =
  | "paymentRecords"
  | "clientHistory"
  | "outstandingReports";

export function hasPaymentCapability(
  entitlements: PlanEntitlements,
  capability: PaymentCapability,
): boolean {
  if (capability === "paymentRecords") return entitlements.canUsePaymentRecords;
  if (capability === "clientHistory") return entitlements.canUseClientHistory;
  return entitlements.canUseOutstandingReports;
}

export function assertPaymentCapability(
  entitlements: PlanEntitlements,
  capability: PaymentCapability,
): void {
  if (!hasPaymentCapability(entitlements, capability)) {
    throw new Error(`Plan does not include ${capability} (Professional+ required).`);
  }
}

/** Guard helpers matching A0 entitlement flags. */
export function gatePaymentRecords(entitlements: PlanEntitlements): boolean {
  return entitlements.canUsePaymentRecords;
}

export function gateClientHistory(entitlements: PlanEntitlements): boolean {
  return entitlements.canUseClientHistory;
}

export function gateOutstandingReports(entitlements: PlanEntitlements): boolean {
  return entitlements.canUseOutstandingReports;
}
