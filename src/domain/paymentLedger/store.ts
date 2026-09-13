import { defaultStorage, type StorageLike } from "../saas/accountTypes";
import { AUDIT_MEMORY_SOFT_WARN } from "./audit";
import { clampLedger } from "./clamp";
import { createEmptyLedger } from "./empty";
import type { PaymentLedgerState } from "./types";

export const PAYMENT_LEDGER_STORAGE_KEY = "cabinet-studio-payment-ledger-v1";
export { AUDIT_MEMORY_SOFT_WARN };

export function readPaymentLedger(
  storage: StorageLike | null = defaultStorage(),
): PaymentLedgerState {
  if (!storage) return createEmptyLedger();
  try {
    const raw = storage.getItem(PAYMENT_LEDGER_STORAGE_KEY);
    if (!raw) return createEmptyLedger();
    return clampLedger(JSON.parse(raw) as Partial<PaymentLedgerState>);
  } catch {
    return createEmptyLedger();
  }
}

/**
 * Persist full ledger history. Audit is never truncated on save (spec §7).
 * Soft warning threshold: AUDIT_MEMORY_SOFT_WARN — surface in UX only; do not drop.
 */
export function persistPaymentLedger(
  state: PaymentLedgerState,
  storage: StorageLike | null = defaultStorage(),
): PaymentLedgerState {
  const next = clampLedger(state);
  if (storage) {
    storage.setItem(PAYMENT_LEDGER_STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export function clearPaymentLedger(
  storage: StorageLike | null = defaultStorage(),
): void {
  storage?.removeItem(PAYMENT_LEDGER_STORAGE_KEY);
}
