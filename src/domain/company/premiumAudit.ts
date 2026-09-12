/**
 * Richer audit views / reporting (Company · canUsePremiumAudit).
 * Same retained payment + freeze history as Professional; more filters/export.
 */

import type { LedgerAuditEvent, PaymentLedgerState } from "../paymentLedger/types";
import { buildLedgerTrail, type LedgerTrailItem } from "../paymentLedger/trail";
import { premiumAuditToCsv } from "./premiumAuditCsv";
import type {
  ApprovalAuditLike,
  FreezeAuditEvent,
  PremiumAuditFilter,
  PremiumAuditRow,
} from "./premiumAuditTypes";

export type {
  ApprovalAuditLike,
  FreezeAuditEvent,
  PremiumAuditFilter,
  PremiumAuditKind,
  PremiumAuditRow,
} from "./premiumAuditTypes";

export { premiumAuditToCsv };

function inRange(at: string, fromIso?: string, toIso?: string): boolean {
  if (fromIso && at < fromIso) return false;
  if (toIso && at > toIso) return false;
  return true;
}

function paymentRows(
  state: PaymentLedgerState,
  filter: PremiumAuditFilter,
): PremiumAuditRow[] {
  const trail = buildLedgerTrail(state, {
    documentId: filter.documentId,
    projectId: filter.projectId,
    limit: Number.MAX_SAFE_INTEGER,
  });
  return trail
    .filter((item: LedgerTrailItem) => {
      if (filter.actor && item.actor !== filter.actor) return false;
      if (filter.action && item.kind !== filter.action) return false;
      return inRange(item.at, filter.fromIso, filter.toIso);
    })
    .map((item) => ({
      at: item.at,
      actor: item.actor,
      source: "payment" as const,
      kind: item.kind,
      summary: item.summary,
      documentId: item.documentId,
      paymentId: item.paymentId,
      reason: item.reason,
      projectId: state.documents.find((d) => d.id === item.documentId)?.projectId,
    }));
}

function freezeRows(
  events: FreezeAuditEvent[],
  filter: PremiumAuditFilter,
): PremiumAuditRow[] {
  return events
    .filter((e) => {
      if (filter.projectId && e.projectId !== filter.projectId) return false;
      if (filter.actor && e.actor !== filter.actor) return false;
      if (filter.action && e.action !== filter.action) return false;
      if (filter.kind === "freeze" && e.action === "export") return false;
      if (filter.kind === "export" && e.action !== "export") return false;
      return inRange(e.at, filter.fromIso, filter.toIso);
    })
    .map((e) => ({
      at: e.at,
      actor: e.actor,
      source: "freeze" as const,
      kind: e.action,
      summary: e.detail ?? `${e.action} ${e.revisionLabel ?? e.quoteSnapshotId}`,
      projectId: e.projectId,
      quoteSnapshotId: e.quoteSnapshotId,
    }));
}

function approvalRows(
  events: ApprovalAuditLike[],
  filter: PremiumAuditFilter,
): PremiumAuditRow[] {
  return events
    .filter((e) => {
      if (filter.projectId && e.projectId !== filter.projectId) return false;
      if (filter.actor && e.actor !== filter.actor) return false;
      if (filter.action && e.kind !== filter.action) return false;
      return inRange(e.at, filter.fromIso, filter.toIso);
    })
    .map((e) => ({
      at: e.at,
      actor: e.actor,
      source: "approval" as const,
      kind: e.kind,
      summary: e.summary,
      projectId: e.projectId,
      reason: e.reason,
    }));
}

/** Company premium audit: payment trail + optional freeze/approval streams. */
export function buildPremiumAuditReport(args: {
  ledger: PaymentLedgerState;
  freezeEvents?: FreezeAuditEvent[];
  approvalEvents?: ApprovalAuditLike[];
  filter?: PremiumAuditFilter;
}): PremiumAuditRow[] {
  const filter = args.filter ?? {};
  const kind = filter.kind ?? "all";
  const rows: PremiumAuditRow[] = [];
  if (kind === "all" || kind === "payment") {
    rows.push(...paymentRows(args.ledger, filter));
  }
  if (kind === "all" || kind === "freeze" || kind === "export") {
    rows.push(...freezeRows(args.freezeEvents ?? [], filter));
  }
  if (kind === "all" || kind === "approval") {
    rows.push(...approvalRows(args.approvalEvents ?? [], filter));
  }
  const limit = filter.limit ?? 200;
  return rows
    .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
    .slice(0, limit);
}

export function listPaymentAuditActions(
  state: PaymentLedgerState,
): LedgerAuditEvent[] {
  return [...state.audit];
}
