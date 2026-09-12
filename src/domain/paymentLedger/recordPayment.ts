import { withPaymentAudit, requireDocument } from "./audit";
import { createLedgerId, money, nowIso } from "./ids";
import type { PaymentAllocation, PaymentLedgerState, PaymentRecord } from "./types";

function allocationSum(allocations: PaymentAllocation[]): number {
  return money(allocations.reduce((s, a) => s + a.amount, 0));
}

/** Record a received payment (or partial) against exactly one document. */
export function recordPayment(
  state: PaymentLedgerState,
  args: {
    documentId: string;
    amount: number;
    actor: string;
    at?: string;
    note?: string;
    clientId?: string;
    allocations?: PaymentAllocation[];
  },
): { state: PaymentLedgerState; payment: PaymentRecord } {
  const doc = requireDocument(state, args.documentId);
  const amount = money(args.amount);
  if (amount <= 0) throw new Error("Payment amount must be positive.");
  const allocations =
    args.allocations && args.allocations.length
      ? args.allocations.map((a) => ({ ...a, amount: money(a.amount) }))
      : [{ documentId: doc.id, amount }];
  if (allocationSum(allocations) !== amount) {
    throw new Error("Allocation sum must equal payment amount (count-once).");
  }
  if (allocations.some((a) => a.documentId !== doc.id)) {
    throw new Error("Payment allocates to exactly one commercial document.");
  }
  const payment: PaymentRecord = {
    id: createLedgerId("pay"),
    documentId: doc.id,
    projectId: doc.projectId,
    clientId: args.clientId ?? doc.clientId,
    amount,
    kind: "payment",
    status: "recorded",
    allocations,
    note: args.note,
    actor: args.actor,
    createdAt: nowIso(args.at),
  };
  const next = withPaymentAudit(
    { ...state, payments: [...state.payments, payment] },
    payment,
    "create",
    { actor: args.actor, at: args.at },
  );
  return { state: next, payment };
}
