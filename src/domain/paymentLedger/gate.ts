import { seatHasPermission } from "../company/permissions";
import type { PlanEntitlements } from "../saas/entitlements";
import type { SeatStub } from "../saas/companySchema";

export type PaymentCapability =
  | "paymentRecords"
  | "clientHistory"
  | "outstandingReports";

/** write = record/schedule; correct = void/refund/correct/reallocate. */
export type PaymentMutationKind = "write" | "correct";

/**
 * Mandatory mutation gate: plan entitlements + optional Company seat role.
 * Professional (no seat): canUsePaymentRecords covers both write and correct.
 * Company (seat provided): seatHasPermission(payments:write | payments:correct).
 */
export type PaymentMutationGate = {
  entitlements: PlanEntitlements;
  /** When set (Company seats), role permissions are enforced. */
  seat?: SeatStub | null;
};

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

/**
 * Mandatory check for ledger mutations. Call before record/adjust writes.
 * Aligns write vs correct with Company `payments:write` / `payments:correct`.
 */
export function assertPaymentMutation(
  gate: PaymentMutationGate,
  kind: PaymentMutationKind,
): void {
  assertPaymentCapability(gate.entitlements, "paymentRecords");
  if (gate.seat != null) {
    const permission = kind === "write" ? "payments:write" : "payments:correct";
    if (!seatHasPermission(gate.seat, permission)) {
      throw new Error(`Seat lacks ${permission}.`);
    }
  }
}
