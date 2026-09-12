import { applyPaymentsFifo, netReceivedForDocument, overdueFromBalances } from "./fifo";
import { isDueDatePast, money, nowIso } from "./ids";
import { currentObligationForProject, isCurrentObligation, listCurrentObligations } from "./obligation";
import type {
  OutstandingBreakdown,
  PaymentLedgerState,
  PaymentSchedule,
} from "./types";

function scheduleForDocument(
  state: PaymentLedgerState,
  documentId: string,
): PaymentSchedule | undefined {
  return state.schedules.find((s) => s.documentId === documentId);
}

export function computeDocumentBalances(
  state: PaymentLedgerState,
  documentId: string,
  asOfIso = nowIso(),
): OutstandingBreakdown | null {
  const doc = state.documents.find((d) => d.id === documentId);
  if (!doc) return null;
  const received = netReceivedForDocument(state.payments, documentId);
  const outstanding = Math.max(0, doc.total - received);
  const current = isCurrentObligation(state, documentId);
  // Superseded / non-current: historical only — zero open balances for reports.
  if (!current || doc.superseded) {
    return {
      documentId,
      projectId: doc.projectId,
      documentTotal: doc.total,
      received,
      outstanding: 0,
      overdue: 0,
      isCurrentObligation: false,
    };
  }
  const schedule = scheduleForDocument(state, documentId);
  let overdue = 0;
  if (schedule && schedule.instalments.length) {
    const { balances } = applyPaymentsFifo({
      instalments: schedule.instalments,
      received,
      asOfIso,
    });
    overdue = overdueFromBalances(balances);
  } else if (doc.dueDate && isDueDatePast(doc.dueDate, asOfIso)) {
    overdue = outstanding;
  } else {
    overdue = 0;
  }
  return {
    documentId,
    projectId: doc.projectId,
    documentTotal: doc.total,
    received: money(received),
    outstanding: money(outstanding),
    overdue: money(overdue),
    isCurrentObligation: true,
  };
}

export function outstandingForProject(
  state: PaymentLedgerState,
  projectId: string,
  asOfIso = nowIso(),
): OutstandingBreakdown | null {
  const current = currentObligationForProject(state, projectId);
  if (!current) return null;
  return computeDocumentBalances(state, current.id, asOfIso);
}

/** Owner-style report: sum only current obligations. */
export function sumOpenBalances(
  state: PaymentLedgerState,
  asOfIso = nowIso(),
): { outstanding: number; overdue: number; rows: OutstandingBreakdown[] } {
  const rows = listCurrentObligations(state)
    .map((doc) => computeDocumentBalances(state, doc.id, asOfIso))
    .filter((row): row is OutstandingBreakdown => Boolean(row));
  return {
    outstanding: money(rows.reduce((s, r) => s + r.outstanding, 0)),
    overdue: money(rows.reduce((s, r) => s + r.overdue, 0)),
    rows,
  };
}
