import { describe, expect, it } from "vitest";
import { defaultCabinetProject } from "../cabinetDimensions";
import { createGoldenCabinetInstance } from "../cabinetIdentity";
import {
  addReviewNote,
  applyReviewStateToProject,
  approveProjectReview,
  buildProductionReadinessGate,
  canApproveForRelease,
  createProductionPacketFingerprint,
  createRevisionSnapshot,
  getProjectReviewState,
  releaseForProduction,
} from "./index";

function goldenProject() {
  return {
    ...defaultCabinetProject,
    cabinets: [createGoldenCabinetInstance("frameless-standard-base")],
  };
}

function freezeResolved(project = goldenProject()) {
  const frozen = createRevisionSnapshot(project, { note: "Ready for shop" });
  const cleared = {
    ...frozen.nextReview,
    notes: frozen.nextReview.notes.map((note) => ({ ...note, resolved: true })),
  };
  return applyReviewStateToProject(project, cleared, frozen.nextJob);
}

function approveReady(project = freezeResolved()) {
  const approved = approveProjectReview(project, "QA Lead");
  if ("error" in approved) throw new Error(approved.error);
  return applyReviewStateToProject(project, approved.review, approved.job);
}

describe("production readiness gate", () => {
  it("stays separate from approval and stores a packet fingerprint on release", () => {
    const frozen = freezeResolved();
    expect(canApproveForRelease(frozen).ok).toBe(true);
    const beforeApproval = buildProductionReadinessGate(frozen);
    expect(beforeApproval.items.some((item) => item.id === "approval")).toBe(true);
    expect(beforeApproval.items.some((item) => item.id === "drift")).toBe(true);
    expect(beforeApproval.items.some((item) => item.id === "views")).toBe(false);
    expect(beforeApproval.ready).toBe(false);

    const readyProject = approveReady(frozen);
    const fingerprint = createProductionPacketFingerprint(readyProject);
    expect(fingerprint).toMatch(/^prd-pkt-v2-/);
    expect(createProductionPacketFingerprint(readyProject)).toBe(fingerprint);
    expect(readyProject.revisionHistory?.[0]?.packetFingerprint).toBe(fingerprint);

    const released = releaseForProduction(readyProject);
    expect("error" in released).toBe(false);
    if ("error" in released) return;
    expect(released.review.history[0]?.productionFingerprint).toBe(fingerprint);
    expect(released.job.status).toBe("production");
  });

  it("rejects empty override reasons and never overrides unresolved blockers", () => {
    const frozen = freezeResolved();
    expect("error" in releaseForProduction(frozen, { reason: "   " })).toBe(true);

    const blocked = applyReviewStateToProject(
      frozen,
      addReviewNote(getProjectReviewState(frozen), {
        message: "Missing edge banding confirmation",
        severity: "blocker",
      }),
    );
    const blockedGate = buildProductionReadinessGate(blocked, {
      reason: "Ship it anyway.",
      overriddenAt: "2026-08-31T12:00:00.000Z",
    });
    expect(blockedGate.ready).toBe(false);
    expect(blockedGate.canOverride).toBe(false);
    expect(blockedGate.reasons.some((reason) => /blocker/i.test(reason))).toBe(true);

    const unapproved = buildProductionReadinessGate(frozen, {
      reason: "Pilot shop needs this revision now.",
      overriddenAt: "2026-08-31T12:00:00.000Z",
    });
    if (unapproved.canOverride || unapproved.ready) {
      expect(unapproved.ready).toBe(true);
    }
  });

  it("treats manufacturing errors as hard production blockers", () => {
    const invalid = {
      ...goldenProject(),
      cabinets: goldenProject().cabinets.map((cabinet) => ({
        ...cabinet,
        config: {
          ...cabinet.config,
          dimensions: { ...cabinet.config.dimensions, width: 80, height: 2400, depth: 900 },
        },
      })),
    };
    const frozen = freezeResolved(invalid);
    const approved = approveProjectReview(frozen, "QA Lead");
    expect("error" in approved).toBe(false);
    if ("error" in approved) return;
    const project = applyReviewStateToProject(frozen, approved.review, approved.job);
    const gate = buildProductionReadinessGate(project, {
      reason: "Shop accepted remaining manufacturing notes.",
      overriddenAt: "2026-08-31T12:00:00.000Z",
    });
    expect(gate.items.find((item) => item.id === "manufacturing")?.status).toBe("fail");
    expect(gate.items.find((item) => item.id === "manufacturing")?.overridable).toBe(false);
    expect(gate.canOverride).toBe(false);
    expect(gate.ready).toBe(false);
    expect("error" in releaseForProduction(project, {
      reason: "Shop accepted remaining manufacturing notes.",
      overriddenAt: "2026-08-31T12:00:00.000Z",
    })).toBe(true);
  });
});
