import { appendLedgerAudit } from "./audit";
import { createLedgerId, money, nowIso } from "./ids";
import type {
  ActorStamp,
  CommercialDocument,
  PaymentLedgerState,
} from "./types";

/**
 * Register a frozen quote revision as a commercial document.
 * Spec §7: exactly one current obligation — supersede is mandatory when the
 * project already has a non-superseded document.
 */
export function registerFrozenQuoteDocument(
  state: PaymentLedgerState,
  args: {
    projectId: string;
    quoteSnapshotId: string;
    revisionLabel: string;
    total: number;
    currencyLabel?: string;
    clientId?: string;
    dueDate?: string | null;
    /** Prior quote doc to mark superseded when revising (required if one exists). */
    supersedeDocumentId?: string;
    stamp?: ActorStamp;
  },
): { state: PaymentLedgerState; document: CommercialDocument } {
  const at = nowIso(args.stamp?.at);
  const current = state.documents.filter(
    (doc) => doc.projectId === args.projectId && !doc.superseded,
  );
  if (current.length > 0) {
    if (!args.supersedeDocumentId) {
      throw new Error(
        "Registering a revision requires superseding the current obligation.",
      );
    }
    if (!current.some((doc) => doc.id === args.supersedeDocumentId)) {
      throw new Error("supersedeDocumentId must be a current project obligation.");
    }
  }

  const document: CommercialDocument = {
    id: createLedgerId("cdoc"),
    kind: "frozen_quote",
    projectId: args.projectId,
    clientId: args.clientId,
    quoteSnapshotId: args.quoteSnapshotId,
    revisionLabel: args.revisionLabel,
    total: Math.max(0, money(args.total)),
    currencyLabel: args.currencyLabel ?? "INR",
    dueDate: args.dueDate,
    threadStatus: "quoted",
    createdAt: at,
    superseded: false,
    supersedesDocumentId: args.supersedeDocumentId,
  };

  // Supersede every prior non-superseded doc for this project (exactly one current).
  let documents = state.documents.map((doc) =>
    doc.projectId === args.projectId && !doc.superseded
      ? { ...doc, superseded: true }
      : doc,
  );
  documents = [...documents, document];

  let next: PaymentLedgerState = { ...state, documents };
  next = appendLedgerAudit(next, {
    at,
    actor: args.stamp?.actor?.trim() || "owner",
    action: "document_registered",
    documentId: document.id,
    detail: `frozen_quote ${document.revisionLabel}`,
  });
  return { state: next, document };
}

export function markDocumentAccepted(
  state: PaymentLedgerState,
  documentId: string,
  stamp: ActorStamp,
): PaymentLedgerState {
  const at = nowIso(stamp.at);
  const documents = state.documents.map((doc) =>
    doc.id === documentId && !doc.superseded
      ? { ...doc, threadStatus: "accepted" as const }
      : doc,
  );
  return appendLedgerAudit(
    { ...state, documents },
    {
      at,
      actor: stamp.actor,
      action: "document_accepted",
      documentId,
      reason: stamp.reason,
      detail: "accepted",
    },
  );
}
