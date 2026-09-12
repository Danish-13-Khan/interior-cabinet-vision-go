import { withPaymentAudit, requireDocument } from "./audit";
import { createLedgerId, money, nowIso } from "./ids";
import type { ActorStamp, PaymentLedgerState, PaymentRecord } from "./types";

export function voidPayment(
  state: PaymentLedgerState,
  paymentId: string,
  stamp: ActorStamp,
): PaymentLedgerState {
  if (!stamp.reason?.trim()) throw new Error("Void requires a reason.");
  const at = nowIso(stamp.at);
  const payments = state.payments.map((p) => {
    if (p.id !== paymentId) return p;
    if (p.status === "voided") return p;
    return {
      ...p,
      status: "voided" as const,
      voidedAt: at,
      voidReason: stamp.reason,
      voidActor: stamp.actor,
    };
  });
  const payment = payments.find((p) => p.id === paymentId);
  if (!payment) throw new Error("Unknown payment.");
  return withPaymentAudit({ ...state, payments }, payment, "void", stamp);
}

export function refundPayment(
  state: PaymentLedgerState,
  args: {
    linkedPaymentId: string;
    amount: number;
    stamp: ActorStamp;
    note?: string;
  },
): { state: PaymentLedgerState; payment: PaymentRecord } {
  if (!args.stamp.reason?.trim()) throw new Error("Refund requires a reason.");
  const original = state.payments.find((p) => p.id === args.linkedPaymentId);
  if (!original || original.status !== "recorded") {
    throw new Error("Refund requires a recorded payment.");
  }
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
    reason: args.stamp.reason,
    actor: args.stamp.actor,
    createdAt: nowIso(args.stamp.at),
  };
  const next = withPaymentAudit(
    { ...state, payments: [...state.payments, payment] },
    payment,
    "refund",
    args.stamp,
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
): { state: PaymentLedgerState; payment: PaymentRecord } {
  if (!args.stamp.reason?.trim()) throw new Error("Correction requires a reason.");
  const original = state.payments.find((p) => p.id === args.linkedPaymentId);
  if (!original || original.status !== "recorded") {
    throw new Error("Correction requires a recorded payment.");
  }
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
    reason: args.stamp.reason,
    actor: args.stamp.actor,
    createdAt: nowIso(args.stamp.at),
  };
  const next = withPaymentAudit(
    { ...state, payments: [...state.payments, payment] },
    payment,
    "correct",
    args.stamp,
  );
  return { state: next, payment };
}

export function reallocatePayment(
  state: PaymentLedgerState,
  args: { paymentId: string; toDocumentId: string; stamp: ActorStamp },
): PaymentLedgerState {
  if (!args.stamp.reason?.trim()) throw new Error("Reallocate requires a reason.");
  const target = requireDocument(state, args.toDocumentId);
  const at = nowIso(args.stamp.at);
  const payments = state.payments.map((p) => {
    if (p.id !== args.paymentId) return p;
    return {
      ...p,
      previousDocumentId: p.documentId,
      documentId: target.id,
      projectId: target.projectId,
      allocations: [{ documentId: target.id, amount: p.amount }],
      reallocatedAt: at,
      reallocateReason: args.stamp.reason,
    };
  });
  const payment = payments.find((p) => p.id === args.paymentId);
  if (!payment) throw new Error("Unknown payment.");
  return withPaymentAudit({ ...state, payments }, payment, "reallocate", args.stamp);
}
