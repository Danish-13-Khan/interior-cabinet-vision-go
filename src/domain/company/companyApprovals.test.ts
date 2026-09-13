import { describe, expect, it } from "vitest";
import { createSeatStub } from "../saas/companySchema";
import {
  approveRequest,
  createEmptyApprovalsState,
  hasApprovedClearance,
  listPendingApprovals,
  rejectRequest,
  requestApproval,
} from "./approvals";

describe("approvals workflow stubs (Phase D)", () => {
  it("request → approve clears freeze gate; reject does not", () => {
    let state = createEmptyApprovalsState("org-1");
    const { state: pending, request } = requestApproval(state, {
      projectId: "proj-1",
      kind: "quote_freeze",
      requestedBySeatId: "seat-d",
      quoteSnapshotId: "snap-1",
      revisionLabel: "A",
    });
    expect(listPendingApprovals(pending)).toHaveLength(1);
    expect(
      hasApprovedClearance(pending, {
        projectId: "proj-1",
        kind: "quote_freeze",
        quoteSnapshotId: "snap-1",
      }),
    ).toBe(false);

    const decider = createSeatStub({ email: "owner@studio.test", role: "owner" });
    const approved = approveRequest(pending, {
      requestId: request.id,
      decidedBySeatId: decider.id,
      decidedBySeat: decider,
    });
    expect(
      hasApprovedClearance(approved, {
        projectId: "proj-1",
        kind: "quote_freeze",
        quoteSnapshotId: "snap-1",
      }),
    ).toBe(true);

    const { state: pending2, request: req2 } = requestApproval(
      createEmptyApprovalsState("org-1"),
      {
        projectId: "proj-2",
        kind: "quote_export",
        requestedBySeatId: "seat-d",
      },
    );
    const rejected = rejectRequest(pending2, {
      requestId: req2.id,
      decidedBySeatId: decider.id,
      decidedBySeat: decider,
      reason: "Wait for client",
    });
    expect(
      hasApprovedClearance(rejected, { projectId: "proj-2", kind: "quote_export" }),
    ).toBe(false);
  });

  it("refuses self-approval and seats without approvals:decide", () => {
    const requester = createSeatStub({ email: "d@studio.test", role: "designer" });
    const viewer = createSeatStub({ email: "v@studio.test", role: "viewer" });
    const { state: pending, request } = requestApproval(
      createEmptyApprovalsState("org-1"),
      {
        projectId: "proj-3",
        kind: "quote_freeze",
        requestedBySeatId: requester.id,
        quoteSnapshotId: "snap-3",
      },
    );
    expect(() =>
      approveRequest(pending, {
        requestId: request.id,
        decidedBySeatId: viewer.id,
        decidedBySeat: viewer,
      }),
    ).toThrow(/approvals:decide/);

    const owner = createSeatStub({ email: "o@studio.test", role: "owner" });
    const selfApprover = { ...owner, id: requester.id };
    expect(() =>
      approveRequest(pending, {
        requestId: request.id,
        decidedBySeatId: requester.id,
        decidedBySeat: selfApprover,
      }),
    ).toThrow(/different seat/);
  });

  it("clearance is scoped to the approved revision", () => {
    const decider = createSeatStub({ email: "o2@studio.test", role: "owner" });
    const requester = createSeatStub({ email: "d2@studio.test", role: "designer" });
    const { state: pending, request } = requestApproval(
      createEmptyApprovalsState("org-1"),
      {
        projectId: "proj-4",
        kind: "quote_freeze",
        requestedBySeatId: requester.id,
        quoteSnapshotId: "snap-A",
      },
    );
    const approved = approveRequest(pending, {
      requestId: request.id,
      decidedBySeatId: decider.id,
      decidedBySeat: decider,
    });
    const clearance = (quoteSnapshotId: string) =>
      hasApprovedClearance(approved, {
        projectId: "proj-4",
        kind: "quote_freeze",
        quoteSnapshotId,
      });
    expect(clearance("snap-A")).toBe(true);
    // A newer revision must not inherit revision A's approval.
    expect(clearance("snap-B")).toBe(false);
  });
});
