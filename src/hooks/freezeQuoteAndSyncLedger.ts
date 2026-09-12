import type { InteriorProject } from "../domain/interiorProject";
import type { CabinetProject } from "../domain/cabinetDimensions";
import type { ProjectQuote } from "../domain/projectQuote";
import type { PriceBook } from "../domain/priceBook";
import type { PlanEntitlements } from "../domain/saas/entitlements";
import type { QuoteSnapshot } from "../domain/quoteSettings";
import {
  readProposalCommercial,
  tryFreezeProposal,
} from "../domain/livingRoom/proposal";
import { freezeCabinetProjectQuote } from "../domain/quoteExport";
import {
  ensureCabinetLedgerProjectId,
  syncFrozenQuoteToLedger,
} from "../domain/paymentLedger";
import type { StorageLike } from "../domain/saas/accountTypes";

export type FreezeWithLedgerOk<T> = {
  ok: true;
  document: T;
  /** Set when ledger sync refused or persist failed; freeze still applied. */
  ledgerStatus?: string;
};

export type PreparedCabinetFreeze = {
  project: CabinetProject;
  snapshot: QuoteSnapshot;
  projectId: string;
  /** Present when stable id could not be assigned — skip sync. */
  ledgerRefuseReason?: string;
};

/** Freeze quote + ensure stable ledgerProjectId (no ledger write). */
export function prepareCabinetFreezeForLedger(args: {
  project: CabinetProject;
  quote: ProjectQuote;
  priceBook?: PriceBook | null;
}): PreparedCabinetFreeze {
  const frozen = freezeCabinetProjectQuote(args);
  const ensured = ensureCabinetLedgerProjectId(frozen.project);
  if (!ensured.ok) {
    return {
      project: ensured.project,
      snapshot: frozen.snapshot,
      projectId: "",
      ledgerRefuseReason: ensured.reason,
    };
  }
  return {
    project: ensured.project,
    snapshot: frozen.snapshot,
    projectId: ensured.projectId,
  };
}

/** Freeze quote (entitlement-gated) and register commercial doc on the ledger. */
export function freezeQuoteAndSyncLedger(
  document: InteriorProject,
  args: {
    entitlements: PlanEntitlements;
    priceBook?: PriceBook | null;
    storage?: StorageLike | null;
  },
): FreezeWithLedgerOk<InteriorProject> | { ok: false; reason: string } {
  const result = tryFreezeProposal(document, {
    entitlements: args.entitlements,
    priceBook: args.priceBook,
    bumpRevisionWhenStale: true,
  });
  if (!result.ok) return result;
  const snap = readProposalCommercial(result.document).quoteHistory[0];
  let ledgerStatus: string | undefined;
  if (snap) {
    const sync = syncFrozenQuoteToLedger({
      projectId: result.document.id,
      snapshot: snap,
      actor: "owner",
      storage: args.storage,
    });
    if (!sync.ok) ledgerStatus = sync.reason;
  }
  return { ok: true, document: result.document, ledgerStatus };
}

/** Cabinet freeze + ledger sync (combined helper for tests / simple callers). */
export function freezeCabinetQuoteAndSyncLedger(args: {
  project: CabinetProject;
  quote: ProjectQuote;
  priceBook?: PriceBook | null;
  storage?: StorageLike | null;
}): { project: CabinetProject; ledgerStatus?: string; projectId?: string } {
  const prepared = prepareCabinetFreezeForLedger(args);
  if (prepared.ledgerRefuseReason) {
    return {
      project: prepared.project,
      ledgerStatus: prepared.ledgerRefuseReason,
    };
  }
  const sync = syncFrozenQuoteToLedger({
    projectId: prepared.projectId,
    snapshot: prepared.snapshot,
    actor: "owner",
    storage: args.storage,
  });
  return {
    project: prepared.project,
    projectId: prepared.projectId,
    ledgerStatus: sync.ok ? undefined : sync.reason,
  };
}
