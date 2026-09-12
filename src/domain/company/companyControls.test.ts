import { describe, expect, it } from "vitest";
import { createEmptyOrganizationStub, createSeatStub } from "../saas/companySchema";
import { entitlementsForPlan } from "../saas/entitlements";
import {
  addSeat,
  countActiveSeats,
  ensureOwnerSeat,
  removeSeat,
  updateSeatRole,
} from "./seats";
import {
  canSeatActOnProject,
  resolveProjectAccess,
  seatHasPermission,
} from "./permissions";
import {
  createEmptySharedProjectsState,
  listProjectsVisibleToSeat,
  setSeatProjectAccess,
  shareProject,
} from "./sharedProjects";
import {
  approveRequest,
  createEmptyApprovalsState,
  hasApprovedClearance,
  listPendingApprovals,
  rejectRequest,
  requestApproval,
} from "./approvals";
import {
  assertCompanyCapability,
  gateCompanyControls,
  hasCompanyCapability,
} from "./gate";

describe("company seats & roles (Phase D)", () => {
  it("seeds owner and adds designer/engineer/viewer seats", () => {
    let org = createEmptyOrganizationStub("Rivera Studio");
    org = ensureOwnerSeat(org, { email: "owner@studio.test", displayName: "Alex" });
    org = addSeat(org, { email: "design@studio.test", role: "designer" });
    org = addSeat(org, { email: "eng@studio.test", role: "engineer" });
    org = addSeat(org, { email: "view@studio.test", role: "viewer" });
    expect(countActiveSeats(org)).toBe(4);
    expect(org.seats.map((s) => s.role)).toEqual([
      "owner",
      "designer",
      "engineer",
      "viewer",
    ]);
  });

  it("blocks demoting the only owner", () => {
    let org = createEmptyOrganizationStub();
    org = ensureOwnerSeat(org, { email: "owner@studio.test" });
    const ownerId = org.seats[0]!.id;
    expect(() => updateSeatRole(org, ownerId, "viewer")).toThrow(/only active owner/);
  });

  it("grants owner all permissions; viewer is read-only", () => {
    const owner = createSeatStub({ email: "o@t.co", role: "owner" });
    const viewer = createSeatStub({ email: "v@t.co", role: "viewer" });
    expect(seatHasPermission(owner, "seats:manage")).toBe(true);
    expect(seatHasPermission(owner, "payments:correct")).toBe(true);
    expect(seatHasPermission(viewer, "projects:view")).toBe(true);
    expect(seatHasPermission(viewer, "projects:edit")).toBe(false);
    expect(seatHasPermission(viewer, "payments:write")).toBe(false);
  });

  it("cannot remove owner seat", () => {
    let org = createEmptyOrganizationStub();
    org = ensureOwnerSeat(org, { email: "owner@studio.test" });
    expect(() => removeSeat(org, org.seats[0]!.id)).toThrow(/owner seat/);
  });
});

describe("shared projects permissions (Phase D)", () => {
  it("owner always manages; grant controls other seats", () => {
    let org = createEmptyOrganizationStub();
    org = ensureOwnerSeat(org, { email: "owner@studio.test" });
    org = addSeat(org, { email: "d@studio.test", role: "designer" });
    const ownerId = org.seats[0]!.id;
    const designerId = org.seats[1]!.id;
    let shared = createEmptySharedProjectsState(org.id);
    shared = shareProject(shared, {
      org,
      projectId: "proj-1",
      actorSeatId: ownerId,
      grants: { [designerId]: "edit" },
    });
    expect(
      resolveProjectAccess({
        org,
        grant: shared.projects[0],
        seatId: ownerId,
      }),
    ).toBe("manage");
    expect(
      canSeatActOnProject({
        org,
        grant: shared.projects[0],
        seatId: designerId,
        required: "edit",
      }),
    ).toBe(true);
    shared = setSeatProjectAccess(shared, {
      org,
      projectId: "proj-1",
      seatId: designerId,
      access: "view",
    });
    expect(
      canSeatActOnProject({
        org,
        grant: shared.projects[0],
        seatId: designerId,
        required: "edit",
      }),
    ).toBe(false);
    expect(listProjectsVisibleToSeat(shared, org, designerId)).toHaveLength(1);
  });
});

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

    const approved = approveRequest(pending, {
      requestId: request.id,
      decidedBySeatId: "seat-owner",
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
      decidedBySeatId: "seat-owner",
      reason: "Wait for client",
    });
    expect(
      hasApprovedClearance(rejected, { projectId: "proj-2", kind: "quote_export" }),
    ).toBe(false);
  });
});

describe("company entitlement gates (Phase D)", () => {
  it("gates Company-only capabilities", () => {
    const company = entitlementsForPlan("company");
    const pro = entitlementsForPlan("professional");
    expect(gateCompanyControls(company)).toBe(true);
    expect(gateCompanyControls(pro)).toBe(false);
    expect(hasCompanyCapability(company, "approvals")).toBe(true);
    expect(hasCompanyCapability(pro, "premiumAudit")).toBe(false);
    expect(() => assertCompanyCapability(pro, "companyControls")).toThrow(/Company/);
  });
});
