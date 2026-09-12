import type { CommercialDocument, PaymentLedgerState } from "./types";

function byNewestFirst(a: CommercialDocument, b: CommercialDocument): number {
  if (a.createdAt < b.createdAt) return 1;
  if (a.createdAt > b.createdAt) return -1;
  return 0;
}

/**
 * Current obligation for a project commercial thread (spec §7).
 * Newest non-superseded wins — older accepted A must not beat newer active B.
 * Invoice (invoiced) still preferred when present among current docs.
 */
export function currentObligationForProject(
  state: PaymentLedgerState,
  projectId: string,
): CommercialDocument | null {
  const docs = state.documents
    .filter((doc) => doc.projectId === projectId && !doc.superseded)
    .sort(byNewestFirst);
  if (!docs.length) return null;
  const invoiced = docs.find(
    (doc) => doc.kind === "invoice" && doc.threadStatus === "invoiced",
  );
  if (invoiced) return invoiced;
  return docs[0] ?? null;
}

export function isCurrentObligation(
  state: PaymentLedgerState,
  documentId: string,
): boolean {
  const doc = state.documents.find((item) => item.id === documentId);
  if (!doc || doc.superseded) return false;
  const current = currentObligationForProject(state, doc.projectId);
  return current?.id === documentId;
}

/** All current obligations across projects (for outstanding reports). */
export function listCurrentObligations(state: PaymentLedgerState): CommercialDocument[] {
  const projectIds = [...new Set(state.documents.map((doc) => doc.projectId))];
  return projectIds
    .map((projectId) => currentObligationForProject(state, projectId))
    .filter((doc): doc is CommercialDocument => Boolean(doc));
}
