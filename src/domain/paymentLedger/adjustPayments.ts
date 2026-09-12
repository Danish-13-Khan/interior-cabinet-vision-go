import {
  withPaymentAudit,
  requireActor,
  requireNonSupersededDocument,
} from "./audit";
import {
  assertPaymentMutation,
  type PaymentMutationGate,
} from "./gate";
import { createLedgerId, money, nowIso } from "./ids";
import type { ActorStamp, PaymentLedgerState, PaymentRecord } from "./types";

function requireCorrectStamp(stamp: ActorStamp, label: string): ActorStamp {
  const actor = requireActor(stamp.actor);
  if (!stamp.reason?.trim()) throw new Error(`${label} requires a reason.`);
  return { ...stamp, actor };
}

export function voidPayment(
  state: PaymentLedgerState,
  paymentId: string,
  stamp: ActorStamp,
  gate: PaymentMutationGate,
): PaymentLedgerState {
  assertPaymentMutation(gate, "correct");
  const safe = requireCorrectStamp(stamp, "Void");
  const at = nowIso(safe.at);
  const payments = state.payments.map((p) => {
    if (p.id !== paymentId) return p;
    if (p.status === "voided") return p;
    return {
      ...p,
      status: "voided" as const,
      voidedAt: at,
      voidReason: safe.reason,
      voidActor: safe.actor,
    };
  });
  const payment = payments.find((p) => p.id === paymentId);
  if (!payment) throw new Error("Unknown payment.");
  return withPaymentAudit({ ...state, payments }, payment, "void", safe);
}

export function refundPayment(
  state: PaymentLedgerState,
  args: {
    linkedPaymentId: string;
    amount: number;
    stamp: ActorStamp;
    note?: string;
  },
  gate: PaymentMutationGate,
): { state: PaymentLedgerState; payment: PaymentRecord } {
  assertPaymentMutation(gate, "correct");
  const safe = requireCorrectStamp(args.stamp, "Refund");
  const original = state.payments.find((p) => p.id === args.linkedPaymentId);
  if (!original || original.status !== "recorded") {
    throw new Error("Refund requires a recorded payment.");
  }
  requireNonSupersededDocument(state, original.documentId);
  const amount = -Math.abs(money(args.amount));
  if (amount === 0) throw new Error("Refund amount must be non-zero.");
  const payment: PaymentRecord = {
    id: createLedgerId("pay"),
    documentId: original.documentId,
    projectId: original.projectId,
    clientId: original.clientId,
    amount,
    kind: "refund",
    status: "recorded",
    linkedPaymentId: original.id,
    allocations: [{ documentId: original.documentId, amount }],
    note: args.note,
    reason: safe.reason,
    actor: safe.actor,
    createdAt: nowIso(safe.at),
  };
  const next = withPaymentAudit(
    { ...state, payments: [...state.payments, payment] },
    payment,
    "refund",
    safe,
  );
  return { state: next, payment };
}

export function correctPayment(
  state: PaymentLedgerState,
  args: {
    linkedPaymentId: string;
    adjustment: number;
    stamp: ActorStamp;
    note?: string;
  },
  gate: PaymentMutationGate,
): { state: PaymentLedgerState; payment: PaymentRecord } {
  assertPaymentMutation(gate, "correct");
  const safe = requireCorrectStamp(args.stamp, "Correction");
  const original = state.payments.find((p) => p.id === args.linkedPaymentId);
  if (!original || original.status !== "recorded") {
    throw new Error("Correction requires a recorded payment.");
  }
  requireNonSupersededDocument(state, original.documentId);
  const amount = money(args.adjustment);
  if (amount === 0) throw new Error("Correction adjustment must be non-zero.");
  const payment: PaymentRecord = {
    id: createLedgerId("pay"),
    documentId: original.documentId,
    projectId: original.projectId,
    clientId: original.clientId,
    amount,
    kind: "correction",
    status: "recorded",
    linkedPaymentId: original.id,
    allocations: [{ documentId: original.documentId, amount }],
    note: args.note,
    reason: safe.reason,
    actor: safe.actor,
    createdAt: nowIso(safe.at),
  };
  const next = withPaymentAudit(
    { ...state, payments: [...state.payments, payment] },
    payment,
    "correct",
    safe,
  );
  return { state: next, payment };
}

export function reallocatePayment(
  state: PaymentLedgerState,
  args: { paymentId: string; toDocumentId: string; stamp: ActorStamp },
  gate: PaymentMutationGate,
): PaymentLedgerState {
  assertPaymentMutation(gate, "correct");
  const safe = requireCorrectStamp(args.stamp, "Reallocate");
  const existing = state.payments.find((p) => p.id === args.paymentId);
  if (!existing) throw new Error("Unknown payment.");
  const target = requireNonSupersededDocument(state, args.toDocumentId);
  if (existing.projectId !== target.projectId) {
    throw new Error("Cannot reallocate payment across projects.");
  }
  const at = nowIso(safe.at);
  const payments = state.payments.map((p) => {
    if (p.id !== args.paymentId) return p;
    return {
      ...p,
      previousDocumentId: p.documentId,
      documentId: target.id,
      projectId: target.projectId,
      allocations: [{ documentId: target.id, amount: p.amount }],
      reallocatedAt: at,
      reallocateReason: safe.reason,
    };
  });
  const payment = payments.find((p) => p.id === args.paymentId)!;
  return withPaymentAudit({ ...state, payments }, payment, "reallocate", safe);
}
