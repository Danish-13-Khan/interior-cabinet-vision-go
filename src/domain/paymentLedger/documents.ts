import { createLedgerId, money, nowIso } from "./ids";
import type {
  ActorStamp,
  CommercialDocument,
  PaymentLedgerState,
} from "./types";

function pushAudit(
  state: PaymentLedgerState,
  event: Omit<import("./types").LedgerAuditEvent, "id"> & { id?: string },
): PaymentLedgerState {
  return {
    ...state,
    audit: [
      {
        id: event.id ?? createLedgerId("audit"),
        at: event.at,
        actor: event.actor,
        action: event.action,
        paymentId: event.paymentId,
        documentId: event.documentId,
        reason: event.reason,
        detail: event.detail,
      },
      ...state.audit,
    ].slice(0, 2000),
  };
}

/** Register a frozen quote revision as a commercial document. */
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
    /** Prior quote doc to mark superseded when revising. */
    supersedeDocumentId?: string;
    stamp?: ActorStamp;
  },
): { state: PaymentLedgerState; document: CommercialDocument } {
  const at = nowIso(args.stamp?.at);
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
  };
  let documents = [...state.documents, document];
  if (args.supersedeDocumentId) {
    documents = documents.map((doc) =>
      doc.id === args.supersedeDocumentId ? { ...doc, superseded: true } : doc,
    );
  }
  let next: PaymentLedgerState = { ...state, documents };
  next = pushAudit(next, {
    at,
    actor: args.stamp?.actor ?? "owner",
    action: "create",
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
  return pushAudit(
    { ...state, documents },
    {
      at,
      actor: stamp.actor,
      action: "create",
      documentId,
      reason: stamp.reason,
      detail: "accepted",
    },
  );
}
