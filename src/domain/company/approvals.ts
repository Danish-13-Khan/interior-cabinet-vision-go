/**
 * Approvals workflow stubs — quote freeze / export (Phase D, Company).
 * No payment gateway; Company can gate freeze/export behind approval.
 */

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
  return {
    state: { ...state, requests: [request, ...state.requests].slice(0, 500) },
    request,
  };
}

function decide(
  state: CompanyApprovalsState,
  args: {
    requestId: string;
    decidedBySeatId: string;
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

export function approveRequest(
  state: CompanyApprovalsState,
  args: { requestId: string; decidedBySeatId: string; reason?: string; at?: string },
): CompanyApprovalsState {
  return decide(state, { ...args, status: "approved" });
}

export function rejectRequest(
  state: CompanyApprovalsState,
  args: { requestId: string; decidedBySeatId: string; reason?: string; at?: string },
): CompanyApprovalsState {
  return decide(state, { ...args, status: "rejected" });
}

export function cancelRequest(
  state: CompanyApprovalsState,
  args: { requestId: string; decidedBySeatId: string; reason?: string; at?: string },
): CompanyApprovalsState {
  return decide(state, { ...args, status: "cancelled" });
}

/** True when Company may proceed with freeze/export for this project+kind. */
export function hasApprovedClearance(
  state: CompanyApprovalsState,
  args: { projectId: string; kind: ApprovalKind; quoteSnapshotId?: string },
): boolean {
  return state.requests.some((r) => {
    if (r.projectId !== args.projectId || r.kind !== args.kind) return false;
    if (r.status !== "approved") return false;
    if (args.quoteSnapshotId && r.quoteSnapshotId && r.quoteSnapshotId !== args.quoteSnapshotId) {
      return false;
    }
    return true;
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
