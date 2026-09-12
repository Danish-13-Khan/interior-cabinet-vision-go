import { createLedgerId, nowIso } from "./ids";
import type {
  ActorStamp,
  LedgerAuditAction,
  PaymentLedgerState,
  PaymentRecord,
} from "./types";

export function withPaymentAudit(
  state: PaymentLedgerState,
  payment: PaymentRecord,
  action: LedgerAuditAction,
  stamp: ActorStamp,
  detail?: string,
): PaymentLedgerState {
  return {
    ...state,
    audit: [
      {
        id: createLedgerId("audit"),
        at: nowIso(stamp.at),
        actor: stamp.actor,
        action,
        paymentId: payment.id,
        documentId: payment.documentId,
        reason: stamp.reason ?? payment.reason,
        detail,
      },
      ...state.audit,
    ].slice(0, 2000),
  };
}

export function requireDocument(state: PaymentLedgerState, documentId: string) {
  const doc = state.documents.find((d) => d.id === documentId);
  if (!doc) throw new Error("Unknown commercial document.");
  return doc;
}
