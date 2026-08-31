import { describe, expect, it } from "vitest";
import { defaultCabinetProject } from "./cabinetDimensions";
import {
  addReviewNote,
  approveProjectReview,
  applyReviewStateToProject,
  bumpRevisionLabel,
  buildChangeLogFromFingerprints,
  clampProjectReviewState,
  compareRevisionFingerprints,
  createRevisionFingerprint,
  createRevisionSnapshot,
  releaseForProduction,
} from "./projectReview";

describe("projectReview", () => {
  it("clamps review state and bumps revision labels", () => {
    const state = clampProjectReviewState({
      notes: [{ message: "Check sink clearances", severity: "warning" }],
      history: [{
        revision: "A",
        fingerprint: { cabinetCount: 2 },
        productionFingerprint: "prd-pkt-v1-abc",
        releaseOverride: { reason: "Pilot shop release", overriddenAt: "2026-08-31T12:00:00.000Z" },
      }],
    });
    expect(state.notes[0]?.message).toContain("sink");
    expect(state.history[0]?.revision).toBe("A");
    expect(state.history[0]?.productionFingerprint).toBe("prd-pkt-v1-abc");
    expect(state.history[0]?.releaseOverride?.reason).toBe("Pilot shop release");
    expect(bumpRevisionLabel("A")).toBe("B");
    expect(bumpRevisionLabel("Z")).toBe("Z2");
  });

  it("builds fingerprints and change logs", () => {
    const project = defaultCabinetProject;
    const fp = createRevisionFingerprint(project);
    expect(fp.cabinetCount).toBe(project.cabinets.length);
    expect(fp.partLineCount).toBeGreaterThan(0);
    const next = { ...fp, cabinetCount: fp.cabinetCount + 1, workshopTotal: fp.workshopTotal + 100 };
    const log = buildChangeLogFromFingerprints(fp, next);
    expect(log.some((entry) => entry.kind === "cabinets")).toBe(true);
    const compare = compareRevisionFingerprints(fp, next, "A", "B");
    expect(compare.changes.length).toBeGreaterThan(0);
  });

  it("freezes revisions and gates approval/release", () => {
    let project = defaultCabinetProject;
    const frozen = createRevisionSnapshot(project, {
      note: "Ready for shop review",
      bumpRevision: true,
    });
    project = applyReviewStateToProject(project, frozen.nextReview, frozen.nextJob);
    expect(project.revisionHistory?.[0]?.revision).toBe("B");
    expect(project.job?.revision).toBe("B");

    const withNote = addReviewNote(frozen.nextReview, {
      message: "Blocker: missing edge banding confirmation",
      severity: "blocker",
    });
    project = applyReviewStateToProject(project, withNote, frozen.nextJob);
    const blocked = approveProjectReview(project);
    expect("error" in blocked).toBe(true);

    const cleared = {
      ...withNote,
      notes: withNote.notes.map((note) => ({ ...note, resolved: true })),
    };
    project = applyReviewStateToProject(project, cleared, frozen.nextJob);
    const approved = approveProjectReview(project, "QA Lead");
    expect("error" in approved).toBe(false);
    if ("error" in approved) return;
    project = applyReviewStateToProject(project, approved.review, approved.job);
    expect(project.job?.status).toBe("approved");

    const released = releaseForProduction(project);
    if ("error" in released) {
      expect(released.error).toMatch(/manufacturing error|approved|snapshot|override/i);
      const overridden = releaseForProduction(project, {
        reason: "Shop accepted remaining manufacturing notes.",
        overriddenAt: "2026-08-31T12:00:00.000Z",
      });
      expect("error" in overridden).toBe(false);
      if ("error" in overridden) return;
      expect(overridden.job.status).toBe("production");
      expect(overridden.review.history[0]?.releasedForProduction).toBe(true);
      expect(overridden.review.history[0]?.productionFingerprint).toMatch(/^prd-pkt-v1-/);
      expect(overridden.review.history[0]?.releaseOverride?.reason).toContain("Shop accepted");
      return;
    }
    expect(released.job.status).toBe("production");
    expect(released.review.history[0]?.releasedForProduction).toBe(true);
    expect(released.review.history[0]?.productionFingerprint).toMatch(/^prd-pkt-v1-/);
  });

  it("syncs live manufacturing issues into review notes without duplicating them", () => {
    const invalidProject = {
      ...defaultCabinetProject,
      cabinets: defaultCabinetProject.cabinets.map((cabinet) => ({
        ...cabinet,
        config: {
          ...cabinet.config,
          dimensions: {
            ...cabinet.config.dimensions,
            width: 500,
            height: 2400,
            depth: 900,
          },
        },
      })),
    };

    const first = createRevisionSnapshot(invalidProject);
    const manufacturingCount = first.nextReview.notes.filter(
      (note) => note.source === "manufacturing",
    ).length;
    expect(manufacturingCount).toBe(first.snapshot.openIssues.length);
    expect(manufacturingCount).toBeGreaterThan(0);

    const applied = applyReviewStateToProject(
      invalidProject,
      first.nextReview,
      first.nextJob,
    );
    const second = createRevisionSnapshot(applied);
    const secondManufacturingCount = second.nextReview.notes.filter(
      (note) => note.source === "manufacturing",
    ).length;
    expect(secondManufacturingCount).toBe(second.snapshot.openIssues.length);
  });
});
