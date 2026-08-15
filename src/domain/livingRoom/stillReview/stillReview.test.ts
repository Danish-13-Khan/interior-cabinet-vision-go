import { describe, expect, it } from "vitest";
import {
  createPhase1BenchmarkProject,
  resolvePhase1BenchmarkCameraId,
} from "../phase1Benchmarks";
import { buildStillJob, stillJobProjectContentHash } from "../stillJob";
import {
  acceptStillReview,
  createIdleStillReview,
  openStillReview,
  rejectStillReview,
  retryStillReview,
  stillEligibleForPackage,
} from "./index";

const NOW = "2026-08-15T12:00:00.000Z";

function sampleJob() {
  const project = createPhase1BenchmarkProject("bench-daylight-sofa");
  const cameraId = resolvePhase1BenchmarkCameraId(project, "camera-a");
  return {
    project,
    job: buildStillJob({
      project,
      cameraId,
      jobId: "sj-review-daylight-a",
      createdAt: NOW,
    }),
  };
}

describe("Still review state machine", () => {
  it("accepts a pending still into provenance without mutating the project", () => {
    const { project, job } = sampleJob();
    const before = JSON.stringify(project);
    const pending = openStillReview(job, "hero-plate.png", "still-output.png");
    const accepted = acceptStillReview(pending, NOW);

    expect(JSON.stringify(project)).toBe(before);
    expect(stillEligibleForPackage(pending)).toBe(false);
    expect(stillEligibleForPackage(accepted)).toBe(true);
    expect(accepted.provenance?.acceptanceStatus).toBe("accepted");
    expect(accepted.provenance?.projectContentHash).toBe(stillJobProjectContentHash(project));
    expect(accepted.provenance?.cameraId).toBe(job.cameraId);
    expect(accepted.provenance?.engine.id).toBe(job.engine.id);
  });

  it("keeps rejected stills out of the package", () => {
    const { job } = sampleJob();
    const rejected = rejectStillReview(openStillReview(job, "hero-plate.png", "still-output.png"));
    expect(stillEligibleForPackage(rejected)).toBe(false);
    expect(rejected.provenance?.acceptanceStatus).toBe("rejected");
  });

  it("retry clears provenance so a new job must be built", () => {
    const { job } = sampleJob();
    const retried = retryStillReview(openStillReview(job, "hero-plate.png", "still-output.png"));
    expect(retried.status).toBe("retry_requested");
    expect(retried.provenance).toBeNull();
    expect(stillEligibleForPackage(retried)).toBe(false);
    expect(createIdleStillReview().status).toBe("idle");
  });
});
