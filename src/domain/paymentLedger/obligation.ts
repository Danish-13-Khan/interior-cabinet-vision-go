import type { CommercialDocument, PaymentLedgerState } from "./types";

/** Current obligation for a project commercial thread (spec §7). */
export function currentObligationForProject(
  state: PaymentLedgerState,
  projectId: string,
): CommercialDocument | null {
  const docs = state.documents.filter((doc) => doc.projectId === projectId && !doc.superseded);
  if (!docs.length) return null;
  const invoiced = docs.find((doc) => doc.kind === "invoice" && doc.threadStatus === "invoiced");
  if (invoiced) return invoiced;
  const accepted = docs.find((doc) => doc.threadStatus === "accepted");
  if (accepted) return accepted;
  // Newest non-superseded frozen quote (documents append chronologically).
  const quotes = docs.filter((doc) => doc.kind === "frozen_quote");
  return quotes[quotes.length - 1] ?? docs[docs.length - 1] ?? null;
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
