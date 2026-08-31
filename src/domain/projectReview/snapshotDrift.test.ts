import { describe, expect, it } from "vitest";
import { defaultCabinetProject } from "../cabinetDimensions";
import { createGoldenCabinetInstance } from "../cabinetIdentity";
import {
  applyReviewStateToProject,
  approveProjectReview,
  buildProductionReadinessGate,
  createRevisionSnapshot,
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

function shiftCabinet(project: ReturnType<typeof goldenProject>, deltaX: number) {
  return {
    ...project,
    cabinets: project.cabinets.map((cabinet) => ({
      ...cabinet,
      placement: { ...cabinet.placement, x: cabinet.placement.x + deltaX },
    })),
  };
}

describe("snapshot drift gate", () => {
  it("blocks release after placement drift until re-freeze and re-approval", () => {
    const frozen = freezeResolved();
    const approved = approveProjectReview(frozen, "QA Lead");
    expect("error" in approved).toBe(false);
    if ("error" in approved) return;
    const ready = applyReviewStateToProject(frozen, approved.review, approved.job);
    expect(buildProductionReadinessGate(ready).ready).toBe(true);

    const drifted = shiftCabinet(ready, 100);
    const gate = buildProductionReadinessGate(drifted, {
      reason: "Keep the old snapshot.",
      overriddenAt: "2026-08-31T12:00:00.000Z",
    });
    expect(gate.items.find((item) => item.id === "drift")?.status).toBe("fail");
    expect(gate.canOverride).toBe(false);
    expect(gate.ready).toBe(false);
    const blocked = releaseForProduction(drifted);
    expect("error" in blocked).toBe(true);
    if (!("error" in blocked)) return;
    expect(blocked.error).toMatch(/re-freeze/i);

    const refrozen = freezeResolved(drifted);
    const reapproved = approveProjectReview(refrozen, "QA Lead");
    expect("error" in reapproved).toBe(false);
    if ("error" in reapproved) return;
    const current = applyReviewStateToProject(refrozen, reapproved.review, reapproved.job);
    const released = releaseForProduction(current);
    expect("error" in released).toBe(false);
    if ("error" in released) return;
    expect(released.job.status).toBe("production");
  });

  it("requires legacy snapshots without a packet fingerprint to be re-frozen", () => {
    const frozen = freezeResolved();
    const approved = approveProjectReview(frozen, "QA Lead");
    expect("error" in approved).toBe(false);
    if ("error" in approved) return;
    const ready = applyReviewStateToProject(frozen, approved.review, approved.job);
    const legacy = {
      ...ready,
      revisionHistory: ready.revisionHistory?.map((snapshot, index) =>
        index === 0 ? { ...snapshot, packetFingerprint: undefined } : snapshot,
      ),
    };

    const gate = buildProductionReadinessGate(legacy);
    expect(gate.items.find((item) => item.id === "drift")?.status).toBe("fail");
    expect(gate.ready).toBe(false);
    expect("error" in releaseForProduction(legacy)).toBe(true);
  });
});
