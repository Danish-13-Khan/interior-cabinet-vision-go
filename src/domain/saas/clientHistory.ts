/**
 * Consolidated client history (Phase C, Professional+).
 * Extends Designer basic client (name/contact/project link) — no parallel CRM.
 */

import {
  createBasicClientStub,
  type BasicClientContact,
  type BasicClientRecord,
} from "./basicClient";
import type { OutstandingBreakdown, PaymentLedgerState, PaymentRecord } from "../paymentLedger/types";
import { outstandingForProject } from "../paymentLedger/outstanding";
import { listCurrentObligations } from "../paymentLedger/obligation";
import { money } from "../paymentLedger/ids";

export type ClientHistoryRecord = BasicClientRecord & {
  /** All linked projects (consolidated). */
  projectIds: string[];
  createdAt: string;
  tags?: string[];
};

export function createClientHistoryRecord(
  partial: Partial<ClientHistoryRecord> & { contact?: Partial<BasicClientContact> } = {},
): ClientHistoryRecord {
  const base = createBasicClientStub(partial);
  const projectIds = Array.isArray(partial.projectIds)
    ? [...new Set(partial.projectIds.map(String).filter(Boolean))]
    : base.projectId
      ? [base.projectId]
      : [];
  return {
    ...base,
    projectIds,
    projectId: partial.projectId ?? projectIds[0],
    createdAt: partial.createdAt ?? base.updatedAt,
    tags: Array.isArray(partial.tags)
      ? partial.tags.map((t) => String(t).trim().slice(0, 40)).filter(Boolean).slice(0, 12)
      : undefined,
  };
}

export function linkProjectToClient(
  client: ClientHistoryRecord,
  projectId: string,
): ClientHistoryRecord {
  const projectIds = [...new Set([...client.projectIds, projectId])];
  return {
    ...client,
    projectIds,
    projectId: client.projectId ?? projectId,
    updatedAt: new Date().toISOString(),
  };
}

export type ClientHistorySummary = {
  client: ClientHistoryRecord;
  projectCount: number;
  paymentCount: number;
  outstanding: number;
  overdue: number;
  obligations: OutstandingBreakdown[];
};

export function summarizeClientHistory(
  client: ClientHistoryRecord,
  ledger: PaymentLedgerState,
): ClientHistorySummary {
  const projectIds = new Set(client.projectIds);
  if (client.projectId) projectIds.add(client.projectId);
  // Attribution requires the project to be linked to this client. A stray
  // clientId on a document must not pull an unlinked project's balance in.
  const obligations = listCurrentObligations(ledger)
    .filter((doc) => projectIds.has(doc.projectId))
    .map((doc) => outstandingForProject(ledger, doc.projectId))
    .filter((row): row is OutstandingBreakdown => Boolean(row));
  const payments = ledger.payments.filter((p: PaymentRecord) =>
    projectIds.has(p.projectId),
  );
  return {
    client,
    projectCount: projectIds.size,
    paymentCount: payments.filter((p) => p.status === "recorded").length,
    outstanding: money(obligations.reduce((s, o) => s + o.outstanding, 0)),
    overdue: money(obligations.reduce((s, o) => s + o.overdue, 0)),
    obligations,
  };
}
