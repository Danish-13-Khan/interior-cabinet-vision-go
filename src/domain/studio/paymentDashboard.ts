import { computeDocumentBalances, currentObligationForProject } from "../paymentLedger";
import type { PaymentLedgerState } from "../paymentLedger";

export type PaymentDashboard = {
  revision: string;
  currency: string;
  total: number;
  received: number;
  outstanding: number;
  overdue: number;
  instalments: { id: string; label: string; amount: number; dueDate: string }[];
};

export function paymentDashboard(
  state: PaymentLedgerState,
  projectId: string,
  asOfIso?: string,
): PaymentDashboard | null {
  const doc = currentObligationForProject(state, projectId);
  if (!doc) return null;
  const balance = computeDocumentBalances(state, doc.id, asOfIso);
  if (!balance) return null;
  const schedule = state.schedules.find((item) => item.documentId === doc.id);
  return {
    revision: doc.revisionLabel,
    currency: doc.currencyLabel,
    total: balance.documentTotal,
    received: balance.received,
    outstanding: balance.outstanding,
    overdue: balance.overdue,
    instalments: (schedule?.instalments ?? []).map((item) => ({
      id: item.id,
      label: item.label,
      amount: item.amount,
      dueDate: item.dueDate,
    })),
  };
}
