/**
 * Create / clamp local account snapshots.
 */

import {
  createDefaultSubscription,
  type SubscriptionStatus,
} from "./billing";
import { createEmptyOrganizationStub } from "./companySchema";
import {
  clampPlanSku,
  DEFAULT_PLAN_SKU,
  type PlanSku,
} from "./plans";
import {
  nowIso,
  type LocalAccountSnapshot,
} from "./accountTypes";

const KNOWN_STATUSES: SubscriptionStatus[] = [
  "none",
  "trialing",
  "active",
  "past_due",
  "grace",
  "suspended",
  "canceled",
];

export function createLocalAccount(args: {
  email: string;
  displayName?: string;
  companyName?: string;
  planSku?: PlanSku;
  status?: SubscriptionStatus;
}): LocalAccountSnapshot {
  const planSku = args.planSku ?? DEFAULT_PLAN_SKU;
  const status = args.status ?? "active";
  return {
    schemaVersion: 1,
    email: args.email.trim().toLowerCase() || "local@cabinet.studio",
    displayName: args.displayName,
    companyName: args.companyName,
    subscription: createDefaultSubscription(planSku, status),
    organization:
      planSku === "company"
        ? createEmptyOrganizationStub(args.companyName ?? "My studio")
        : null,
    updatedAt: nowIso(),
  };
}

export function clampLocalAccount(
  value: Partial<LocalAccountSnapshot> | null | undefined,
): LocalAccountSnapshot {
  const email =
    typeof value?.email === "string" && value.email.trim()
      ? value.email.trim().toLowerCase()
      : "local@cabinet.studio";
  const planSku = clampPlanSku(value?.subscription?.planSku);
  const status = (value?.subscription?.status ?? "active") as SubscriptionStatus;
  // Fail closed: an unrecognised/tampered status must not grant paid entitlements.
  const safeStatus = KNOWN_STATUSES.includes(status) ? status : "none";
  const base = createLocalAccount({
    email,
    displayName:
      typeof value?.displayName === "string" ? value.displayName : undefined,
    companyName:
      typeof value?.companyName === "string" ? value.companyName : undefined,
    planSku,
    status: safeStatus,
  });
  return {
    ...base,
    organization:
      planSku === "company"
        ? value?.organization ?? base.organization
        : null,
    updatedAt:
      typeof value?.updatedAt === "string" ? value.updatedAt : base.updatedAt,
    subscription: {
      ...base.subscription,
      currentPeriodEnd:
        typeof value?.subscription?.currentPeriodEnd === "string"
          ? value.subscription.currentPeriodEnd
          : null,
      providerCustomerId:
        typeof value?.subscription?.providerCustomerId === "string"
          ? value.subscription.providerCustomerId
          : null,
      providerSubscriptionId:
        typeof value?.subscription?.providerSubscriptionId === "string"
          ? value.subscription.providerSubscriptionId
          : null,
      updatedAt:
        typeof value?.subscription?.updatedAt === "string"
          ? value.subscription.updatedAt
          : base.subscription.updatedAt,
    },
  };
}
