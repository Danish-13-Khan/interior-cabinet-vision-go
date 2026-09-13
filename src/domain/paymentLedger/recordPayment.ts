import {
  withPaymentAudit,
  requireActor,
  requireNonSupersededDocument,
} from "./audit";
import {
  assertPaymentMutation,
  type PaymentMutationGate,
} from "./gate";
import { instalmentOverridesFromPayments } from "./fifo";
import { createLedgerId, money, nowIso } from "./ids";
import type { PaymentAllocation, PaymentLedgerState, PaymentRecord } from "./types";

function allocationSum(allocations: PaymentAllocation[]): number {
  return money(allocations.reduce((s, a) => s + a.amount, 0));
}

/**
 * Reject unknown instalment ids and allocations that exceed remaining capacity.
 * Prevents FIFO override pool burn from over-cap / phantom ids at record time.
 */
export function assertInstalmentAllocations(
  state: PaymentLedgerState,
  documentId: string,
  allocations: PaymentAllocation[],
): void {
  const schedule = state.schedules.find((s) => s.documentId === documentId);
  const caps = new Map((schedule?.instalments ?? []).map((i) => [i.id, i.amount]));
  const prior = instalmentOverridesFromPayments(state.payments, documentId);
  const batch: Record<string, number> = {};
  for (const a of allocations) {
    if (!a.instalmentId) continue;
    if (!caps.has(a.instalmentId)) {
      throw new Error(`Unknown instalment id: ${a.instalmentId}`);
    }
    if (a.amount < 0) {
      throw new Error("Instalment allocation must be non-negative.");
    }
    batch[a.instalmentId] = money((batch[a.instalmentId] ?? 0) + a.amount);
  }
  for (const [id, amount] of Object.entries(batch)) {
    const cap = caps.get(id) ?? 0;
    const already = money(prior[id] ?? 0);
    const remaining = Math.max(0, money(cap - already));
    if (amount > remaining) {
      throw new Error(
        `Instalment allocation exceeds remaining capacity for ${id}.`,
      );
    }
  }
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
  gate: PaymentMutationGate,
): { state: PaymentLedgerState; payment: PaymentRecord } {
  assertPaymentMutation(gate, "write");
  const actor = requireActor(args.actor);
  const doc = requireNonSupersededDocument(state, args.documentId);
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
  assertInstalmentAllocations(state, doc.id, allocations);
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
    actor,
    createdAt: nowIso(args.at),
  };
  const next = withPaymentAudit(
    { ...state, payments: [...state.payments, payment] },
    payment,
    "create",
    { actor, at: args.at },
  );
  return { state: next, payment };
}
