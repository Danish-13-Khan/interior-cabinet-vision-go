/**
 * OUR SaaS subscription billing hooks/stubs only (A0).
 * No end-client payment processing. No real payment provider yet.
 */

import type { PlanSku } from "./plans";

/** Normalized product subscription state (provider states map here later). */
export type SubscriptionStatus =
  | "none"
  | "trialing"
  | "active"
  | "past_due"
  | "grace"
  | "suspended"
  | "canceled";

export type SaaSSubscriptionStub = {
  planSku: PlanSku;
  status: SubscriptionStatus;
  /** ISO timestamps; null until a real provider exists. */
  currentPeriodEnd: string | null;
  /** Hosted checkout / portal URLs would live here later. */
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
  updatedAt: string;
};

export type BillingCheckoutRequest = {
  planSku: PlanSku;
  /** Return path after hosted checkout (unused stub). */
  successPath?: string;
  cancelPath?: string;
};

export type BillingCheckoutResult = {
  ok: false;
  reason: "provider_not_configured";
  message: string;
};

export type BillingPortalResult = {
  ok: false;
  reason: "provider_not_configured";
  message: string;
};

const NOT_CONFIGURED =
  "SaaS billing provider is not configured yet. Subscription changes are local stubs only.";

export function createDefaultSubscription(
  planSku: PlanSku,
  status: SubscriptionStatus = "active",
): SaaSSubscriptionStub {
  return {
    planSku,
    status,
    currentPeriodEnd: null,
    providerCustomerId: null,
    providerSubscriptionId: null,
    updatedAt: new Date().toISOString(),
  };
}

/** True when commercial access should grant paid entitlements. */
export function isSubscriptionCommerciallyActive(
  status: SubscriptionStatus,
): boolean {
  return status === "active" || status === "trialing" || status === "grace";
}

/**
 * Start OUR subscription checkout (stub).
 * Never collects end-client (homeowner) payments.
 */
export async function startSaaSCheckout(
  _request: BillingCheckoutRequest,
): Promise<BillingCheckoutResult> {
  return {
    ok: false,
    reason: "provider_not_configured",
    message: NOT_CONFIGURED,
  };
}

/** Open OUR customer billing portal (stub). */
export async function openSaaSBillingPortal(): Promise<BillingPortalResult> {
  return {
    ok: false,
    reason: "provider_not_configured",
    message: NOT_CONFIGURED,
  };
}

/** Local-only plan change for A0 demos / tests (not a paid upgrade). */
export function stubSetLocalPlan(
  subscription: SaaSSubscriptionStub,
  planSku: PlanSku,
  status: SubscriptionStatus = "active",
): SaaSSubscriptionStub {
  return {
    ...subscription,
    planSku,
    status,
    updatedAt: new Date().toISOString(),
  };
}
