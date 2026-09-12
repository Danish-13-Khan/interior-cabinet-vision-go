/**
 * Owner dashboard aggregates (Phase D).
 * Uses Phase C ledger — current-obligation only for open balances.
 */

import { listCurrentObligations } from "../paymentLedger/obligation";
import {
  computeDocumentBalances,
  sumOpenBalances,
} from "../paymentLedger/outstanding";
import { netReceivedForDocument } from "../paymentLedger/fifo";
import type {
  CommercialDocument,
  OutstandingBreakdown,
  PaymentLedgerState,
} from "../paymentLedger/types";
import { companyMoney } from "./ids";

export type OwnerDashboardAggregates = {
  /** Sum of current-obligation totals with threadStatus quoted. */
  quoted: number;
  /** Sum of current-obligation totals with threadStatus accepted. */
  accepted: number;
  /** Sum of current-obligation totals with threadStatus invoiced. */
  invoiced: number;
  /** Net received on current obligations only. */
  received: number;
  /** Outstanding on current obligations only. */
  outstanding: number;
  /** Overdue on current obligations only. */
  overdue: number;
  projectCount: number;
  rows: OutstandingBreakdown[];
};

function sumByStatus(
  docs: CommercialDocument[],
  status: CommercialDocument["threadStatus"],
): number {
  return companyMoney(
    docs.filter((d) => d.threadStatus === status).reduce((s, d) => s + d.total, 0),
  );
}

/**
 * Owner rollup: quoted / accepted / invoiced / received / outstanding.
 * Superseded documents never enter open totals.
 */
export function buildOwnerDashboard(
  state: PaymentLedgerState,
  asOfIso?: string,
): OwnerDashboardAggregates {
  const current = listCurrentObligations(state);
  const open = sumOpenBalances(state, asOfIso);
  const received = companyMoney(
    current.reduce(
      (sum, doc) => sum + netReceivedForDocument(state.payments, doc.id),
      0,
    ),
  );
  return {
    quoted: sumByStatus(current, "quoted"),
    accepted: sumByStatus(current, "accepted"),
    invoiced: sumByStatus(current, "invoiced"),
    received,
    outstanding: open.outstanding,
    overdue: open.overdue,
    projectCount: current.length,
    rows: open.rows,
  };
}

export function ownerDashboardForProjects(
  state: PaymentLedgerState,
  projectIds: string[],
  asOfIso?: string,
): OwnerDashboardAggregates {
  const allow = new Set(projectIds);
  const filteredDocs = state.documents.filter((d) => allow.has(d.projectId));
  const filtered: PaymentLedgerState = {
    ...state,
    documents: filteredDocs,
    payments: state.payments.filter((p) => allow.has(p.projectId)),
    schedules: state.schedules.filter((s) =>
      filteredDocs.some((d) => d.id === s.documentId),
    ),
    audit: state.audit.filter((a) =>
      filteredDocs.some((d) => d.id === a.documentId),
    ),
  };
  return buildOwnerDashboard(filtered, asOfIso);
}

export function projectObligationRow(
  state: PaymentLedgerState,
  projectId: string,
  asOfIso?: string,
): OutstandingBreakdown | null {
  const current = listCurrentObligations(state).find(
    (d) => d.projectId === projectId,
  );
  if (!current) return null;
  return computeDocumentBalances(state, current.id, asOfIso);
}
