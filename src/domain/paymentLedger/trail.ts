import type { LedgerAuditEvent, PaymentLedgerState, PaymentRecord } from "./types";

export type LedgerTrailItem = {
  at: string;
  actor: string;
  kind: string;
  summary: string;
  paymentId?: string;
  documentId: string;
  reason?: string;
};

/** Basic chronological trail for Professional+ (full history retained). */
export function buildLedgerTrail(
  state: PaymentLedgerState,
  opts?: { documentId?: string; projectId?: string; limit?: number },
): LedgerTrailItem[] {
  /** `limit` omitted → 100 (basic trail). Pass Infinity / large n for full history views. */
  const limit = opts?.limit ?? 100;
  const docIds = new Set(
    state.documents
      .filter((d) => {
        if (opts?.documentId) return d.id === opts.documentId;
        if (opts?.projectId) return d.projectId === opts.projectId;
        return true;
      })
      .map((d) => d.id),
  );

  const fromAudit: LedgerTrailItem[] = state.audit
    .filter((e) => docIds.has(e.documentId))
    .map((e: LedgerAuditEvent) => ({
      at: e.at,
      actor: e.actor,
      kind: e.action,
      summary: e.detail ?? e.action,
      paymentId: e.paymentId,
      documentId: e.documentId,
      reason: e.reason,
    }));

  // Prefer audit stream (covers void/reallocate/roll-forward). Sort newest first.
  return fromAudit
    .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
    .slice(0, limit);
}

export function listPaymentsForDocument(
  state: PaymentLedgerState,
  documentId: string,
): PaymentRecord[] {
  return state.payments
    .filter((p) => p.documentId === documentId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}
