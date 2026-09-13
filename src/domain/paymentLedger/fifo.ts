import { dueDateValue, isDueDatePast, money } from "./ids";
import type { InstalmentBalance, PaymentInstalment, PaymentRecord } from "./types";

/** Net received on a document from non-voided ledger rows (count-once). */
export function netReceivedForDocument(
  payments: PaymentRecord[],
  documentId: string,
): number {
  return money(
    payments
      .filter((p) => p.status === "recorded" && p.documentId === documentId)
      .reduce((sum, p) => sum + p.amount, 0),
  );
}

/**
 * Sum recorded allocation amounts targeting specific instalment ids.
 * Used so overdue respects user overrides before FIFO (spec §7).
 */
export function instalmentOverridesFromPayments(
  payments: PaymentRecord[],
  documentId: string,
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const p of payments) {
    if (p.status !== "recorded" || p.documentId !== documentId) continue;
    for (const a of p.allocations) {
      if (!a.instalmentId) continue;
      map[a.instalmentId] = money((map[a.instalmentId] ?? 0) + a.amount);
    }
  }
  return map;
}

/**
 * Apply net received: honour instalment overrides first, then FIFO by due date.
 * Override amounts are capped to each instalment; unabsorbed override returns to the
 * pool (never silently burned). Remaining after all instalments is unscheduled.
 */
export function applyPaymentsFifo(args: {
  instalments: PaymentInstalment[];
  received: number;
  asOfIso: string;
  /** Explicit paid amounts per instalment id (user override). */
  instalmentPaid?: Record<string, number>;
}): { balances: InstalmentBalance[]; unscheduledRemainderPaid: number } {
  const ordered = [...args.instalments].sort(
    (a, b) => dueDateValue(a.dueDate) - dueDateValue(b.dueDate),
  );
  const targeted = args.instalmentPaid ?? {};
  let pool = Math.max(0, money(args.received));

  const paidMap: Record<string, number> = {};
  for (const inst of ordered) {
    const override = Math.max(0, money(targeted[inst.id] ?? 0));
    const apply = Math.min(inst.amount, override, pool);
    paidMap[inst.id] = apply;
    pool = money(pool - apply);
  }
  for (const inst of ordered) {
    const already = paidMap[inst.id] ?? 0;
    const room = Math.max(0, inst.amount - already);
    const add = Math.min(room, pool);
    paidMap[inst.id] = already + add;
    pool = money(pool - add);
  }

  const balances: InstalmentBalance[] = ordered.map((inst) => {
    const paid = paidMap[inst.id] ?? 0;
    const unpaid = Math.max(0, inst.amount - paid);
    return {
      instalmentId: inst.id,
      label: inst.label,
      amount: inst.amount,
      dueDate: inst.dueDate,
      paid,
      unpaid,
      overdue: unpaid > 0 && isDueDatePast(inst.dueDate, args.asOfIso),
    };
  });
  return { balances, unscheduledRemainderPaid: pool };
}

/** Overdue = unpaid balances on past-due instalments only (never future). */
export function overdueFromBalances(balances: InstalmentBalance[]): number {
  return money(balances.filter((b) => b.overdue).reduce((sum, b) => sum + b.unpaid, 0));
}
