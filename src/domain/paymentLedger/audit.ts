import { createLedgerId, nowIso } from "./ids";
import type {
  ActorStamp,
  LedgerAuditAction,
  LedgerAuditEvent,
  PaymentLedgerState,
  PaymentRecord,
} from "./types";

/**
 * Soft memory warning threshold only — never truncate audit history.
 * Spec §7: full history retained on Professional+. Callers may surface UX
 * when `state.audit.length >= AUDIT_MEMORY_SOFT_WARN`.
 */
export const AUDIT_MEMORY_SOFT_WARN = 10_000;

export function appendLedgerAudit(
  state: PaymentLedgerState,
  event: Omit<LedgerAuditEvent, "id"> & { id?: string },
): PaymentLedgerState {
  const nextEvent: LedgerAuditEvent = {
    id: event.id ?? createLedgerId("audit"),
    at: event.at,
    actor: event.actor,
    action: event.action,
    paymentId: event.paymentId,
    documentId: event.documentId,
    reason: event.reason,
    detail: event.detail,
    instalmentIds: event.instalmentIds?.length ? [...event.instalmentIds] : undefined,
  };
  // Persist full history (unbounded append). Do not slice/drop on write/save.
  return {
    ...state,
    audit: [nextEvent, ...state.audit],
  };
}

export function instalmentIdsFromPayment(payment: PaymentRecord): string[] | undefined {
  const ids = [
    ...new Set(
      payment.allocations
        .map((a) => a.instalmentId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  return ids.length ? ids : undefined;
}

export function withPaymentAudit(
  state: PaymentLedgerState,
  payment: PaymentRecord,
  action: LedgerAuditAction,
  stamp: ActorStamp,
  detail?: string,
): PaymentLedgerState {
  return appendLedgerAudit(state, {
    at: nowIso(stamp.at),
    actor: stamp.actor,
    action,
    paymentId: payment.id,
    documentId: payment.documentId,
    reason: stamp.reason ?? payment.reason,
    detail,
    instalmentIds: instalmentIdsFromPayment(payment),
  });
}

export function requireDocument(state: PaymentLedgerState, documentId: string) {
  const doc = state.documents.find((d) => d.id === documentId);
  if (!doc) throw new Error("Unknown commercial document.");
  return doc;
}

export function requireNonSupersededDocument(
  state: PaymentLedgerState,
  documentId: string,
) {
  const doc = requireDocument(state, documentId);
  if (doc.superseded) {
    throw new Error("Cannot mutate payments against a superseded document.");
  }
  return doc;
}

export function requireActor(actor: string | undefined | null): string {
  const trimmed = String(actor ?? "").trim();
  if (!trimmed) throw new Error("Actor is required.");
  return trimmed;
}
