/**
 * Ensure / mutate local account for marketing session or desktop.
 */

import { createEmptyOrganizationStub } from "./companySchema";
import { DEFAULT_PLAN_SKU, type PlanSku } from "./plans";
import { createLocalAccount } from "./accountModel";
import {
  persistLocalAccount,
  readLocalAccount,
} from "./accountPersistence";
import {
  defaultStorage,
  nowIso,
  type LocalAccountSnapshot,
  type StorageLike,
} from "./accountTypes";

/**
 * Ensure a local account exists for the marketing session identity.
 * Default plan = Designer with active local subscription stub.
 */
export function ensureLocalAccountForSession(
  session: { email: string; company?: string } | null | undefined,
  storage: StorageLike | null = defaultStorage(),
): LocalAccountSnapshot {
  const existing = readLocalAccount(storage);
  const email = (session?.email ?? existing?.email ?? "local@cabinet.studio")
    .trim()
    .toLowerCase();

  if (existing && existing.email === email) {
    const next =
      session?.company && !existing.companyName
        ? { ...existing, companyName: session.company, updatedAt: nowIso() }
        : existing;
    if (next !== existing) persistLocalAccount(next, storage);
    return next;
  }

  const created = createLocalAccount({
    email,
    companyName: session?.company,
    planSku: DEFAULT_PLAN_SKU,
    status: "active",
  });
  persistLocalAccount(created, storage);
  return created;
}

/** Desktop / Tauri path with no marketing login — local Designer account. */
export function ensureDesktopLocalAccount(
  storage: StorageLike | null = defaultStorage(),
): LocalAccountSnapshot {
  return ensureLocalAccountForSession(
    { email: "desktop@local.cabinet.studio", company: "Local workspace" },
    storage,
  );
}

export function setLocalPlanSku(
  planSku: PlanSku,
  storage: StorageLike | null = defaultStorage(),
): LocalAccountSnapshot {
  const current =
    readLocalAccount(storage) ??
    createLocalAccount({ email: "local@cabinet.studio" });
  const next: LocalAccountSnapshot = {
    ...current,
    subscription: {
      ...current.subscription,
      planSku,
      status: "active",
      updatedAt: nowIso(),
    },
    organization:
      planSku === "company"
        ? current.organization ??
          createEmptyOrganizationStub(current.companyName ?? "My studio")
        : null,
    updatedAt: nowIso(),
  };
  persistLocalAccount(next, storage);
  return next;
}
