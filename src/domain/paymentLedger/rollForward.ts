import { createLedgerId, money, nowIso } from "./ids";
import type {
  ActorStamp,
  CommercialDocument,
  PaymentLedgerState,
} from "./types";

/**
 * Quote → invoice: payments on the quote document roll forward once to the
 * invoice parent (same ledger rows, new documentId). Count-once preserved.
 */
export function createInvoiceAndRollForward(
  state: PaymentLedgerState,
  args: {
    quoteDocumentId: string;
    invoiceTotal?: number;
    dueDate?: string | null;
    stamp: ActorStamp;
  },
): { state: PaymentLedgerState; invoice: CommercialDocument } {
  const quote = state.documents.find((d) => d.id === args.quoteDocumentId);
  if (!quote || quote.kind !== "frozen_quote") {
    throw new Error("Invoice roll-forward requires a frozen quote document.");
  }
  if (quote.superseded) {
    throw new Error("Cannot invoice a superseded quote.");
  }
  const at = nowIso(args.stamp.at);
  const invoice: CommercialDocument = {
    id: createLedgerId("cdoc"),
    kind: "invoice",
    projectId: quote.projectId,
    clientId: quote.clientId,
    quoteSnapshotId: quote.quoteSnapshotId,
    revisionLabel: quote.revisionLabel,
    total: Math.max(0, money(args.invoiceTotal ?? quote.total)),
    currencyLabel: quote.currencyLabel,
    dueDate: args.dueDate === undefined ? quote.dueDate : args.dueDate,
    supersedesDocumentId: quote.id,
    threadStatus: "invoiced",
    createdAt: at,
    superseded: false,
  };
  const documents = state.documents.map((doc) =>
    doc.id === quote.id ? { ...doc, superseded: true } : doc,
  );
  documents.push(invoice);

  // Move schedule pointer if it was on the quote.
  const schedules = state.schedules.map((s) =>
    s.documentId === quote.id ? { ...s, documentId: invoice.id, updatedAt: at } : s,
  );

  // Same ledger rows, new parent pointer — counted once.
  const payments = state.payments.map((p) => {
    if (p.documentId !== quote.id) return p;
    return {
      ...p,
      previousDocumentId: p.documentId,
      documentId: invoice.id,
      allocations: [{ documentId: invoice.id, amount: p.amount }],
      reallocatedAt: at,
      reallocateReason: args.stamp.reason ?? "quote_to_invoice_roll_forward",
    };
  });

  const next: PaymentLedgerState = {
    ...state,
    documents,
    schedules,
    payments,
    audit: [
      {
        id: createLedgerId("audit"),
        at,
        actor: args.stamp.actor,
        action: "roll_forward",
        documentId: invoice.id,
        reason: args.stamp.reason,
        detail: `from ${quote.id}`,
      },
      ...state.audit,
    ].slice(0, 2000),
  };
  return { state: next, invoice };
}
