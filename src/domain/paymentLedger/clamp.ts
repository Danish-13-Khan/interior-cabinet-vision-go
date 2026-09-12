import { createEmptyLedger } from "./empty";
import { createLedgerId, money, nowIso } from "./ids";
import type {
  CommercialDocument,
  LedgerAuditEvent,
  PaymentAllocation,
  PaymentInstalment,
  PaymentLedgerState,
  PaymentRecord,
  PaymentSchedule,
} from "./types";

const KINDS = new Set(["frozen_quote", "invoice"]);
const THREAD = new Set(["quoted", "accepted", "invoiced"]);
const PAY_KINDS = new Set(["payment", "refund", "correction"]);
const PAY_STATUS = new Set(["recorded", "voided"]);

export function clampAllocation(raw: Partial<PaymentAllocation> | undefined): PaymentAllocation | null {
  if (!raw?.documentId) return null;
  return {
    documentId: String(raw.documentId),
    instalmentId: raw.instalmentId ? String(raw.instalmentId) : undefined,
    amount: money(raw.amount ?? 0),
  };
}

export function clampInstalment(raw: Partial<PaymentInstalment> | undefined): PaymentInstalment | null {
  if (!raw) return null;
  const amount = money(raw.amount ?? 0);
  if (amount <= 0) return null;
  return {
    id: String(raw.id ?? createLedgerId("inst")),
    label: String(raw.label ?? "Instalment").trim().slice(0, 80) || "Instalment",
    amount,
    dueDate: String(raw.dueDate ?? "").slice(0, 40),
  };
}

export function clampDocument(raw: Partial<CommercialDocument> | undefined): CommercialDocument | null {
  if (!raw?.id || !raw.projectId || !raw.quoteSnapshotId) return null;
  const kind = KINDS.has(String(raw.kind)) ? (raw.kind as CommercialDocument["kind"]) : "frozen_quote";
  const threadStatus = THREAD.has(String(raw.threadStatus))
    ? (raw.threadStatus as CommercialDocument["threadStatus"])
    : "quoted";
  return {
    id: String(raw.id),
    kind,
    projectId: String(raw.projectId),
    clientId: raw.clientId ? String(raw.clientId) : undefined,
    quoteSnapshotId: String(raw.quoteSnapshotId),
    revisionLabel: String(raw.revisionLabel ?? "A").trim() || "A",
    total: Math.max(0, money(raw.total ?? 0)),
    currencyLabel: String(raw.currencyLabel ?? "INR").trim().slice(0, 12) || "INR",
    dueDate: raw.dueDate === null ? null : raw.dueDate ? String(raw.dueDate).slice(0, 40) : undefined,
    supersedesDocumentId: raw.supersedesDocumentId ? String(raw.supersedesDocumentId) : undefined,
    threadStatus,
    createdAt: String(raw.createdAt ?? nowIso()),
    superseded: Boolean(raw.superseded),
  };
}

export function clampSchedule(raw: Partial<PaymentSchedule> | undefined): PaymentSchedule | null {
  if (!raw?.id || !raw.documentId) return null;
  const instalments = (Array.isArray(raw.instalments) ? raw.instalments : [])
    .map((item) => clampInstalment(item))
    .filter((item): item is PaymentInstalment => Boolean(item))
    .slice(0, 24);
  return {
    id: String(raw.id),
    documentId: String(raw.documentId),
    instalments,
    createdAt: String(raw.createdAt ?? nowIso()),
    updatedAt: String(raw.updatedAt ?? nowIso()),
  };
}

/**
 * Clamp a payment. Rejects when `sum(allocations) !== amount` (no silent repair).
 * Empty allocations are repaired to a single parent allocation (valid shape).
 */
export function clampPayment(raw: Partial<PaymentRecord> | undefined): PaymentRecord | null {
  if (!raw?.id || !raw.documentId || !raw.projectId) return null;
  const kind = PAY_KINDS.has(String(raw.kind)) ? (raw.kind as PaymentRecord["kind"]) : "payment";
  const status = PAY_STATUS.has(String(raw.status)) ? (raw.status as PaymentRecord["status"]) : "recorded";
  const amount = money(raw.amount ?? 0);
  const rawAllocs = Array.isArray(raw.allocations) ? raw.allocations : [];
  let allocations = rawAllocs
    .map((item) => clampAllocation(item))
    .filter((item): item is PaymentAllocation => Boolean(item));
  if (!allocations.length) {
    allocations = [{ documentId: String(raw.documentId), amount }];
  } else {
    const allocSum = money(allocations.reduce((s, a) => s + a.amount, 0));
    if (allocSum !== amount) {
      // Explicit reject — do not silently load corrupt allocation data.
      return null;
    }
  }
  return {
    id: String(raw.id),
    documentId: String(raw.documentId),
    projectId: String(raw.projectId),
    clientId: raw.clientId ? String(raw.clientId) : undefined,
    amount,
    kind,
    status,
    linkedPaymentId: raw.linkedPaymentId ? String(raw.linkedPaymentId) : undefined,
    allocations,
    note: raw.note ? String(raw.note).trim().slice(0, 400) : undefined,
    reason: raw.reason ? String(raw.reason).trim().slice(0, 400) : undefined,
    actor: String(raw.actor ?? "owner").trim().slice(0, 120) || "owner",
    createdAt: String(raw.createdAt ?? nowIso()),
    voidedAt: raw.voidedAt ? String(raw.voidedAt) : undefined,
    voidReason: raw.voidReason ? String(raw.voidReason).trim().slice(0, 400) : undefined,
    voidActor: raw.voidActor ? String(raw.voidActor).trim().slice(0, 120) : undefined,
    previousDocumentId: raw.previousDocumentId ? String(raw.previousDocumentId) : undefined,
    reallocatedAt: raw.reallocatedAt ? String(raw.reallocatedAt) : undefined,
    reallocateReason: raw.reallocateReason
      ? String(raw.reallocateReason).trim().slice(0, 400)
      : undefined,
  };
}

export function clampAudit(raw: Partial<LedgerAuditEvent> | undefined): LedgerAuditEvent | null {
  if (!raw?.id || !raw.documentId || !raw.action) return null;
  const instalmentIds = Array.isArray(raw.instalmentIds)
    ? raw.instalmentIds.map(String).filter(Boolean).slice(0, 48)
    : undefined;
  return {
    id: String(raw.id),
    at: String(raw.at ?? nowIso()),
    actor: String(raw.actor ?? "owner").trim().slice(0, 120) || "owner",
    action: raw.action,
    paymentId: raw.paymentId ? String(raw.paymentId) : undefined,
    documentId: String(raw.documentId),
    reason: raw.reason ? String(raw.reason).trim().slice(0, 400) : undefined,
    detail: raw.detail ? String(raw.detail).trim().slice(0, 400) : undefined,
    instalmentIds: instalmentIds?.length ? instalmentIds : undefined,
  };
}

export function clampLedger(raw: Partial<PaymentLedgerState> | undefined): PaymentLedgerState {
  if (!raw) return createEmptyLedger();
  return {
    schemaVersion: 1,
    documents: (Array.isArray(raw.documents) ? raw.documents : [])
      .map((item) => clampDocument(item))
      .filter((item): item is CommercialDocument => Boolean(item)),
    schedules: (Array.isArray(raw.schedules) ? raw.schedules : [])
      .map((item) => clampSchedule(item))
      .filter((item): item is PaymentSchedule => Boolean(item)),
    payments: (Array.isArray(raw.payments) ? raw.payments : [])
      .map((item) => clampPayment(item))
      .filter((item): item is PaymentRecord => Boolean(item)),
    // Full history retained — never truncate audit on load/save.
    audit: (Array.isArray(raw.audit) ? raw.audit : [])
      .map((item) => clampAudit(item))
      .filter((item): item is LedgerAuditEvent => Boolean(item)),
  };
}
