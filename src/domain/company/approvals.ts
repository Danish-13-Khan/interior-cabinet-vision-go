/**
 * Approvals workflow stubs — quote freeze / export (Phase D, Company).
 * No payment gateway; Company can gate freeze/export behind approval.
 */

import { seatHasPermission } from "./permissions";
import type { SeatStub } from "../saas/companySchema";

export type ApprovalKind = "quote_freeze" | "quote_export" | "invoice_export";

export type ApprovalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled";

export type ApprovalRequest = {
  id: string;
  orgId: string;
  projectId: string;
  kind: ApprovalKind;
  status: ApprovalStatus;
  requestedBySeatId: string;
  decidedBySeatId?: string;
  reason?: string;
  note?: string;
  quoteSnapshotId?: string;
  revisionLabel?: string;
  createdAt: string;
  decidedAt?: string;
};

export type CompanyApprovalsState = {
  schemaVersion: 1;
  orgId: string;
  requests: ApprovalRequest[];
};

function newId(): string {
  return `appr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyApprovalsState(orgId: string): CompanyApprovalsState {
  return { schemaVersion: 1, orgId, requests: [] };
}

export function requestApproval(
  state: CompanyApprovalsState,
  args: {
    projectId: string;
    kind: ApprovalKind;
    requestedBySeatId: string;
    quoteSnapshotId?: string;
    revisionLabel?: string;
    note?: string;
    at?: string;
  },
): { state: CompanyApprovalsState; request: ApprovalRequest } {
  const projectId = args.projectId.trim();
  if (!projectId) throw new Error("projectId is required.");
  const at = args.at ?? new Date().toISOString();
  const request: ApprovalRequest = {
    id: newId(),
    orgId: state.orgId,
    projectId,
    kind: args.kind,
    status: "pending",
    requestedBySeatId: args.requestedBySeatId,
    note: args.note?.trim() || undefined,
    quoteSnapshotId: args.quoteSnapshotId,
    revisionLabel: args.revisionLabel,
    createdAt: at,
  };
  // Full approval history retained — `hasApprovedClearance` reads this list.
  return {
    state: { ...state, requests: [request, ...state.requests] },
    request,
  };
}

function decide(
  state: CompanyApprovalsState,
  args: {
    requestId: string;
    decidedBySeatId: string;
    decidedBySeat: SeatStub;
    status: "approved" | "rejected" | "cancelled";
    reason?: string;
    at?: string;
  },
): CompanyApprovalsState {
  const at = args.at ?? new Date().toISOString();
  const found = state.requests.find((r) => r.id === args.requestId);
  if (!found) throw new Error("Unknown approval request.");
  if (found.status !== "pending") {
    throw new Error(`Approval already ${found.status}.`);
  }
  const isSelf = found.requestedBySeatId === args.decidedBySeatId;
  if (args.status === "cancelled") {
    // Requesters may withdraw their own request; otherwise a decider is required.
    if (!isSelf && !seatHasPermission(args.decidedBySeat, "approvals:decide")) {
      throw new Error("Seat lacks approvals:decide.");
    }
  } else {
    if (!seatHasPermission(args.decidedBySeat, "approvals:decide")) {
      throw new Error("Seat lacks approvals:decide.");
    }
    // Segregation of duties: a requester cannot approve or reject their own request.
    if (isSelf) {
      throw new Error("Approvals require a different seat than the requester.");
    }
  }
  return {
    ...state,
    requests: state.requests.map((r) =>
      r.id === args.requestId
        ? {
            ...r,
            status: args.status,
            decidedBySeatId: args.decidedBySeatId,
            reason: args.reason?.trim() || undefined,
            decidedAt: at,
          }
        : r,
    ),
  };
}

export type ApprovalDecisionArgs = {
  requestId: string;
  decidedBySeatId: string;
  decidedBySeat: SeatStub;
  reason?: string;
  at?: string;
};

export function approveRequest(
  state: CompanyApprovalsState,
  args: ApprovalDecisionArgs,
): CompanyApprovalsState {
  return decide(state, { ...args, status: "approved" });
}

export function rejectRequest(
  state: CompanyApprovalsState,
  args: ApprovalDecisionArgs,
): CompanyApprovalsState {
  return decide(state, { ...args, status: "rejected" });
}

export function cancelRequest(
  state: CompanyApprovalsState,
  args: ApprovalDecisionArgs,
): CompanyApprovalsState {
  return decide(state, { ...args, status: "cancelled" });
}

/**
 * True when Company may proceed with freeze/export for this project+kind.
 * Clearance is revision-scoped: when the caller names a snapshot, only an
 * approval carrying that exact snapshot id clears it, so an approval for an
 * earlier revision never authorises a newer one.
 */
export function hasApprovedClearance(
  state: CompanyApprovalsState,
  args: { projectId: string; kind: ApprovalKind; quoteSnapshotId?: string },
): boolean {
  return state.requests.some((r) => {
    if (r.projectId !== args.projectId || r.kind !== args.kind) return false;
    if (r.status !== "approved") return false;
    if (args.quoteSnapshotId) return r.quoteSnapshotId === args.quoteSnapshotId;
    // No snapshot named: only a project-wide approval (no snapshot) clears.
    return !r.quoteSnapshotId;
  });
}

export function listPendingApprovals(
  state: CompanyApprovalsState,
  projectId?: string,
): ApprovalRequest[] {
  return state.requests.filter(
    (r) => r.status === "pending" && (!projectId || r.projectId === projectId),
  );
}
