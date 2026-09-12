/**
 * Payment ledger types (Phase C).
 * Extends frozen quotes / invoice templates — no gateway, no second commerce stack.
 * Spec: BUSINESS_PRODUCT_SCOPE §7.
 */

export type CommercialDocKind = "frozen_quote" | "invoice";

/** quoted → accepted → invoiced (user-driven commercial thread). */
export type CommercialThreadStatus = "quoted" | "accepted" | "invoiced";

export type CommercialDocument = {
  id: string;
  kind: CommercialDocKind;
  projectId: string;
  clientId?: string;
  /** Frozen QuoteSnapshot.id this document is bound to. */
  quoteSnapshotId: string;
  revisionLabel: string;
  total: number;
  currencyLabel: string;
  /** Document-level due date when no schedule exists. */
  dueDate?: string | null;
  /** Invoice that superseded a quote points at the prior document id. */
  supersedesDocumentId?: string;
  threadStatus: CommercialThreadStatus;
  createdAt: string;
  /** True once a later document superseded this one. */
  superseded: boolean;
};

export type PaymentInstalment = {
  id: string;
  label: string;
  amount: number;
  /** ISO date (yyyy-mm-dd or full ISO). */
  dueDate: string;
};

export type PaymentSchedule = {
  id: string;
  documentId: string;
  instalments: PaymentInstalment[];
  createdAt: string;
  updatedAt: string;
};

export type PaymentKind = "payment" | "refund" | "correction";

export type PaymentStatus = "recorded" | "voided";

/** Allocation target; sum(allocations.amount) === payment.amount (signed). */
export type PaymentAllocation = {
  documentId: string;
  instalmentId?: string;
  amount: number;
};

export type PaymentRecord = {
  id: string;
  /** Exactly one commercial document parent (count-once). */
  documentId: string;
  projectId: string;
  clientId?: string;
  /** Signed: payment ≥ 0; refund ≤ 0; correction either. */
  amount: number;
  kind: PaymentKind;
  status: PaymentStatus;
  linkedPaymentId?: string;
  allocations: PaymentAllocation[];
  note?: string;
  reason?: string;
  actor: string;
  createdAt: string;
  voidedAt?: string;
  voidReason?: string;
  voidActor?: string;
  previousDocumentId?: string;
  reallocatedAt?: string;
  reallocateReason?: string;
};

export type LedgerAuditAction =
  | "create"
  | "document_registered"
  | "document_accepted"
  | "correct"
  | "refund"
  | "void"
  | "reallocate"
  | "roll_forward"
  | "schedule_set";

export type LedgerAuditEvent = {
  id: string;
  at: string;
  actor: string;
  action: LedgerAuditAction;
  paymentId?: string;
  documentId: string;
  reason?: string;
  detail?: string;
  /** Instalment ids touched by this event (spec §7 retention). */
  instalmentIds?: string[];
};

export type PaymentLedgerState = {
  schemaVersion: 1;
  documents: CommercialDocument[];
  schedules: PaymentSchedule[];
  payments: PaymentRecord[];
  audit: LedgerAuditEvent[];
};

export type ActorStamp = {
  actor: string;
  at?: string;
  reason?: string;
};

export type OutstandingBreakdown = {
  documentId: string;
  projectId: string;
  documentTotal: number;
  received: number;
  outstanding: number;
  overdue: number;
  isCurrentObligation: boolean;
};

export type InstalmentBalance = {
  instalmentId: string;
  label: string;
  amount: number;
  dueDate: string;
  paid: number;
  unpaid: number;
  overdue: boolean;
};
