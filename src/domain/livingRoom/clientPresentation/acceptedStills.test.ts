import { describe, expect, it } from "vitest";
import { createLivingRoomReleaseDemoProject } from "..";
import { stillJobProjectContentHash } from "../stillJob/projectHash";
import type { StillProvenance } from "../stillJob/provenance";
import { freezeProposal, recordProposalRelease } from "../proposal";
import {
  filterPackageEligibleStills,
  isPackageEligibleStill,
  withAcceptedStillProvenance,
} from "./acceptedStills";
import { buildClientPresentationPackage } from "./buildPackage";

const NOW = "2026-08-12T21:00:00.000Z";

function sampleProvenance(
  project: ReturnType<typeof createLivingRoomReleaseDemoProject>,
  overrides: Partial<StillProvenance> = {},
): StillProvenance {
  return {
    schemaVersion: 2,
    jobId: "sj-bound",
    projectId: project.id,
    projectContentHash: stillJobProjectContentHash(project),
    snapshotId: "snap",
    cameraId: "cam-a",
    engine: { id: "stilljob-hero", version: "1.0.0" },
    seed: 0,
    allowedEnhancements: ["exposure_grade"],
    mode: "faithful_enhance",
    acceptanceStatus: "accepted",
    acceptedAt: NOW,
    ...overrides,
  };
}

describe("package-eligible accepted stills", () => {
  it("requires matching projectId and current projectContentHash", () => {
    const project = createLivingRoomReleaseDemoProject();
    const current = sampleProvenance(project);
    expect(isPackageEligibleStill(project, current)).toBe(true);

    const staleHash = sampleProvenance(project, { projectContentHash: "sj-proj-stale" });
    expect(isPackageEligibleStill(project, staleHash)).toBe(false);

    const foreignProject = sampleProvenance(project, { projectId: "other-project" });
    expect(isPackageEligibleStill(project, foreignProject)).toBe(false);

    const rejected = sampleProvenance(project, { acceptanceStatus: "rejected" });
    expect(isPackageEligibleStill(project, rejected)).toBe(false);
  });

  it("drops stale or foreign accepted stills from the manifest", () => {
    const project = createLivingRoomReleaseDemoProject();
    const pack = buildClientPresentationPackage(project, null, NOW);
    const manifest = withAcceptedStillProvenance(pack.manifest, project, [
      sampleProvenance(project),
      sampleProvenance(project, { jobId: "sj-stale", projectContentHash: "sj-proj-old" }),
      sampleProvenance(project, { jobId: "sj-foreign", projectId: "other-project" }),
      sampleProvenance(project, { jobId: "sj-rejected", acceptanceStatus: "rejected" }),
    ]);
    expect(manifest.acceptedStills).toHaveLength(1);
    expect(manifest.acceptedStills[0]?.jobId).toBe("sj-bound");
    expect(filterPackageEligibleStills(project, manifest.acceptedStills)).toEqual(manifest.acceptedStills);
  });

  it("keeps accepted captures eligible while selecting each package camera", () => {
    const project = createLivingRoomReleaseDemoProject();
    const cameraIds = project.cameras.slice(0, 3).map((camera) => camera.id);
    expect(cameraIds).toHaveLength(3);
    const projectContentHash = stillJobProjectContentHash(project);
    const accepted = cameraIds.map((cameraId, index) => sampleProvenance(project, {
      jobId: `sj-camera-${index + 1}`,
      cameraId,
      projectContentHash,
    }));

    for (const activeCameraId of cameraIds) {
      const selected = {
        ...project,
        renderSettings: { ...project.renderSettings, activeCameraId },
      };
      expect(stillJobProjectContentHash(selected)).toBe(projectContentHash);
      expect(filterPackageEligibleStills(selected, accepted)).toHaveLength(3);
    }
  });

  it("keeps accepted captures eligible after the proposal PDF is recorded", () => {
    const frozen = freezeProposal(createLivingRoomReleaseDemoProject(), NOW);
    const accepted = sampleProvenance(frozen);
    const released = recordProposalRelease(frozen, NOW);

    expect(stillJobProjectContentHash(released)).toBe(stillJobProjectContentHash(frozen));
    expect(isPackageEligibleStill(released, accepted)).toBe(true);
  });

  it("still invalidates accepted captures after a visual object change", () => {
    const project = createLivingRoomReleaseDemoProject();
    const accepted = sampleProvenance(project);
    const changed = {
      ...project,
      objects: project.objects.map((object, index) => index === 0
        ? { ...object, position: { ...object.position, x: object.position.x + 100 } }
        : object),
    };
    expect(isPackageEligibleStill(changed, accepted)).toBe(false);
  });
});
