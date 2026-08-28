import { describe, expect, it } from "vitest";
import {
  createIdleStillReview,
  openStillReview,
  acceptStillReview,
} from "./reviewMachine";
import {
  isStaleStillAcceptance,
  stillReviewExportStatusMessage,
  stillReviewPanelStatusLabel,
} from "./stillReviewExportStatus";
import { buildStillJob } from "../stillJob";
import { createPhase1BenchmarkProject, resolvePhase1BenchmarkCameraId } from "../phase1Benchmarks";

const NOW = "2026-08-28T12:00:00.000Z";

describe("stillReviewExportStatus", () => {
  it("marks accepted sessions stale when no package-eligible stills remain", () => {
    const project = createPhase1BenchmarkProject("bench-daylight-sofa");
    const cameraId = resolvePhase1BenchmarkCameraId(project, "camera-a");
    const job = buildStillJob({ project, cameraId, jobId: "sj-stale-ui", createdAt: NOW });
    const accepted = acceptStillReview(openStillReview(job, "plate.png", "still.png"), NOW);

    expect(isStaleStillAcceptance(accepted, 0)).toBe(true);
    expect(stillReviewPanelStatusLabel(accepted, 0)).toMatch(/stale acceptance/i);
    expect(stillReviewExportStatusMessage({
      sessionStatus: accepted.status,
      packageEligibleCount: 0,
      exportStatus: "",
      clientExportStatus: "",
    })).toMatch(/stale · project changed · regenerate/i);
  });

  it("keeps the package promise when eligible accepted stills exist", () => {
    const session = acceptStillReview(
      openStillReview(
        buildStillJob({
          project: createPhase1BenchmarkProject("bench-daylight-sofa"),
          cameraId: resolvePhase1BenchmarkCameraId(
            createPhase1BenchmarkProject("bench-daylight-sofa"),
            "camera-a",
          ),
          jobId: "sj-fresh",
          createdAt: NOW,
        }),
        "plate.png",
        "still.png",
      ),
      NOW,
    );
    expect(isStaleStillAcceptance(session, 1)).toBe(false);
    expect(stillReviewExportStatusMessage({
      sessionStatus: session.status,
      packageEligibleCount: 1,
      exportStatus: "",
      clientExportStatus: "",
    })).toMatch(/will record provenance/i);
  });

  it("falls back to export status when review is idle", () => {
    expect(stillReviewExportStatusMessage({
      sessionStatus: createIdleStillReview().status,
      packageEligibleCount: 0,
      exportStatus: "PNG saved successfully.",
      clientExportStatus: "",
    })).toBe("PNG saved successfully.");
  });
});
