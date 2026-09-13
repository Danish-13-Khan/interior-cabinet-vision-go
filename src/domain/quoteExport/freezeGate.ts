import type { PlanEntitlements } from "../saas/entitlements";

export type FreezeGateResult =
  | { ok: true }
  | { ok: false; reason: string };

/** Entitlement gate for freeze + basic revisions (Designer+ when subscription active). */
export function gateFreezeQuotes(
  entitlements: Pick<PlanEntitlements, "canFreezeQuotes"> | null | undefined,
): FreezeGateResult {
  if (!entitlements?.canFreezeQuotes) {
    return {
      ok: false,
      reason: "Quote freeze requires an active paid plan (Designer or higher).",
    };
  }
  return { ok: true };
}

export function canFreezeQuotesFromEntitlements(
  entitlements: Pick<PlanEntitlements, "canFreezeQuotes"> | null | undefined,
): boolean {
  return gateFreezeQuotes(entitlements).ok;
}
