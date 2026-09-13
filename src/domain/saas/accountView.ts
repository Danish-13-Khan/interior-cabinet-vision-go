/**
 * Derived account view + save gate helpers.
 */

import { isSubscriptionCommerciallyActive } from "./billing";
import {
  entitlementsForPlan,
  resolveEntitlements,
} from "./entitlements";
import { clampPlanSku, DEFAULT_PLAN_SKU, type PlanSku } from "./plans";
import { readLocalAccount } from "./accountPersistence";
import {
  defaultStorage,
  type AccountView,
  type StorageLike,
} from "./accountTypes";

export function getAccountView(
  storage: StorageLike | null = defaultStorage(),
): AccountView {
  const account = readLocalAccount(storage);
  if (!account) {
    return {
      account: null,
      planSku: null,
      subscriptionStatus: "none",
      subscriptionActive: false,
      entitlements: resolveEntitlements({
        planSku: DEFAULT_PLAN_SKU,
        subscriptionActive: false,
      }),
    };
  }
  const planSku = clampPlanSku(account.subscription.planSku);
  const subscriptionStatus = account.subscription.status;
  const subscriptionActive = isSubscriptionCommerciallyActive(subscriptionStatus);
  return {
    account,
    planSku,
    subscriptionStatus,
    subscriptionActive,
    entitlements: subscriptionActive
      ? entitlementsForPlan(planSku)
      : resolveEntitlements({ planSku, subscriptionActive: false }),
  };
}

/** Convenience: current plan + canSave for app gates. */
export function getCurrentPlanAndSaveGate(
  storage: StorageLike | null = defaultStorage(),
): {
  planSku: PlanSku | null;
  canSave: boolean;
} {
  const view = getAccountView(storage);
  return {
    planSku: view.planSku,
    canSave: view.entitlements.canSave,
  };
}
