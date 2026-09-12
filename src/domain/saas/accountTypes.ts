/**
 * Local SaaS account types (A0).
 * Email identity comes from marketing session — not a second auth stack.
 */

import type { SaaSSubscriptionStub, SubscriptionStatus } from "./billing";
import type { OrganizationStub } from "./companySchema";
import type { PlanEntitlements } from "./entitlements";
import type { PlanSku } from "./plans";

export const ACCOUNT_STORAGE_KEY = "cabinet-studio-saas-account-v1";

export type LocalAccountSnapshot = {
  schemaVersion: 1;
  /** Matches marketing Session.email when present. */
  email: string;
  displayName?: string;
  companyName?: string;
  subscription: SaaSSubscriptionStub;
  /** Present when plan is Company (schema only); ignored for UX in A0. */
  organization: OrganizationStub | null;
  updatedAt: string;
};

export type AccountView = {
  account: LocalAccountSnapshot | null;
  planSku: PlanSku | null;
  subscriptionStatus: SubscriptionStatus;
  subscriptionActive: boolean;
  entitlements: PlanEntitlements;
};

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function defaultStorage(): StorageLike | null {
  return typeof window !== "undefined" ? window.localStorage : null;
}

export function nowIso(): string {
  return new Date().toISOString();
}
