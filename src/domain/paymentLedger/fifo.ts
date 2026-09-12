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
 * Apply net received FIFO by instalment due date.
 * Remaining received after covering all instalments sits as unscheduled remainder.
 */
export function applyPaymentsFifo(args: {
  instalments: PaymentInstalment[];
  received: number;
  asOfIso: string;
}): { balances: InstalmentBalance[]; unscheduledRemainderPaid: number } {
  const ordered = [...args.instalments].sort(
    (a, b) => dueDateValue(a.dueDate) - dueDateValue(b.dueDate),
  );
  let pool = Math.max(0, money(args.received));
  const balances: InstalmentBalance[] = [];
  for (const inst of ordered) {
    const paid = Math.min(inst.amount, pool);
    pool -= paid;
    const unpaid = Math.max(0, inst.amount - paid);
    balances.push({
      instalmentId: inst.id,
      label: inst.label,
      amount: inst.amount,
      dueDate: inst.dueDate,
      paid,
      unpaid,
      overdue: unpaid > 0 && isDueDatePast(inst.dueDate, args.asOfIso),
    });
  }
  return { balances, unscheduledRemainderPaid: pool };
}

/** Overdue = unpaid balances on past-due instalments only (never future). */
export function overdueFromBalances(balances: InstalmentBalance[]): number {
  return money(balances.filter((b) => b.overdue).reduce((sum, b) => sum + b.unpaid, 0));
}
