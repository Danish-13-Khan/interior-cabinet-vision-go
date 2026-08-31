import { describe, expect, it } from "vitest";
import { defaultCabinetProject } from "../cabinetDimensions";
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

function freezeResolved(project = defaultCabinetProject) {
  const frozen = createRevisionSnapshot(project, { note: "Ready for shop" });
  const cleared = {
    ...frozen.nextReview,
    notes: frozen.nextReview.notes.map((note) => ({ ...note, resolved: true })),
  };
  return applyReviewStateToProject(project, cleared, frozen.nextJob);
}

describe("production readiness gate", () => {
  it("stays separate from approval and stores a packet fingerprint on release", () => {
    const frozen = freezeResolved();
    expect(canApproveForRelease(frozen).ok).toBe(true);
    const beforeApproval = buildProductionReadinessGate(frozen);
    expect(beforeApproval.items.some((item) => item.id === "approval")).toBe(true);
    expect(beforeApproval.items.some((item) => item.id === "views")).toBe(false);
    expect(beforeApproval.ready).toBe(false);

    const approved = approveProjectReview(frozen, "QA Lead");
    expect("error" in approved).toBe(false);
    if ("error" in approved) return;
    const readyProject = applyReviewStateToProject(frozen, approved.review, approved.job);
    const fingerprint = createProductionPacketFingerprint(readyProject);
    expect(fingerprint).toMatch(/^prd-pkt-v1-/);
    expect(createProductionPacketFingerprint(readyProject)).toBe(fingerprint);

    const withoutReason = releaseForProduction(readyProject);
    const released = "error" in withoutReason
      ? releaseForProduction(readyProject, {
          reason: "Workshop accepted remaining manufacturing notes.",
          overriddenAt: "2026-08-31T12:00:00.000Z",
        })
      : withoutReason;
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
});
