import { seatHasPermission } from "../company/permissions";
import type { PlanEntitlements } from "../saas/entitlements";
import type { SeatStub } from "../saas/companySchema";

/** Same view gate as the payments panel: plan entitlement, then company seat. */
export function canViewPaymentRecords(input: {
  entitlements: Pick<PlanEntitlements, "canUsePaymentRecords" | "canUseCompanyControls">;
  seat?: SeatStub | null;
}) {
  if (!input.entitlements.canUsePaymentRecords) return false;
  if (!input.entitlements.canUseCompanyControls) return true;
  return Boolean(input.seat && seatHasPermission(input.seat, "payments:view"));
}
