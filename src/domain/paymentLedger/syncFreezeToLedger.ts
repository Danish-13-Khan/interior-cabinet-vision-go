import { currentObligationForProject } from "./obligation";
import { registerFrozenQuoteDocument } from "./documents";
import { persistPaymentLedger, readPaymentLedger } from "./store";
import type { CommercialDocument, PaymentLedgerState } from "./types";
import type { StorageLike } from "../saas/accountTypes";

export type FreezeLedgerSnapshot = {
  id: string;
  revision: string;
  sellTotal: number;
  currencyLabel?: string;
  customerName?: string;
};

export type FreezeLedgerRefuseCode =
  | "invoice_current"
  | "persist_failed"
  | "unexpected";

export type FreezeLedgerSyncResult =
  | { ok: true; document: CommercialDocument }
  | { ok: false; reason: string; code: FreezeLedgerRefuseCode };

export type RegisterFreezeDocResult =
  | { ok: true; state: PaymentLedgerState; document: CommercialDocument }
  | { ok: false; reason: string; code: "invoice_current" };

export const INVOICE_SUPERSEDE_REFUSE =
  "Cannot register a quote that supersedes an invoice (would hide rolled-forward payments). Invoice remains current.";

export const LEDGER_PERSIST_FAIL =
  "Quote frozen, but payment ledger sync failed (storage full or unavailable).";

export const LEDGER_UNEXPECTED_FAIL =
  "Quote frozen, but payment ledger sync hit an unexpected error.";

/**
 * Register (or supersede) a commercial document when a quote is frozen.
 * Refuses when the current obligation is an invoice. Pure — caller may persist.
 */
export function registerCommercialDocFromFreeze(
  state: PaymentLedgerState,
  args: {
    projectId: string;
    snapshot: FreezeLedgerSnapshot;
    clientId?: string;
    actor?: string;
    at?: string;
  },
): RegisterFreezeDocResult {
  const current = currentObligationForProject(state, args.projectId);
  if (current?.kind === "invoice") {
    return { ok: false, code: "invoice_current", reason: INVOICE_SUPERSEDE_REFUSE };
  }
  const { state: next, document } = registerFrozenQuoteDocument(state, {
    projectId: args.projectId,
    quoteSnapshotId: args.snapshot.id,
    revisionLabel: args.snapshot.revision,
    total: args.snapshot.sellTotal,
    currencyLabel: args.snapshot.currencyLabel,
    clientId: args.clientId,
    supersedeDocumentId: current?.kind === "frozen_quote" ? current.id : undefined,
    stamp: {
      actor: args.actor?.trim() || "owner",
      at: args.at,
    },
  });
  return { ok: true, state: next, document };
}

/** Read → register → persist. Storage failures → persist_failed; logic errors → unexpected. */
export function syncFrozenQuoteToLedger(args: {
  projectId: string;
  snapshot: FreezeLedgerSnapshot;
  clientId?: string;
  actor?: string;
  at?: string;
  storage?: StorageLike | null;
}): FreezeLedgerSyncResult {
  try {
    const state = readPaymentLedger(args.storage);
    const registered = registerCommercialDocFromFreeze(state, args);
    if (!registered.ok) return registered;
    try {
      persistPaymentLedger(registered.state, args.storage);
    } catch {
      return { ok: false, code: "persist_failed", reason: LEDGER_PERSIST_FAIL };
    }
    return { ok: true, document: registered.document };
  } catch (err) {
    const detail = err instanceof Error ? err.message : "";
    return {
      ok: false,
      code: "unexpected",
      reason: detail ? `${LEDGER_UNEXPECTED_FAIL} ${detail}` : LEDGER_UNEXPECTED_FAIL,
    };
  }
}
