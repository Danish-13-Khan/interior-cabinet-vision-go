import type { StillJobAttachmentRefs } from "./types";

/** Deterministic relative paths for Phase 2A support export (no GPU bytes). */
export function stillSupportArtifactRefs(jobId: string): StillJobAttachmentRefs {
  return {
    heroPngPath: `${jobId}-hero-plate.png`,
    depthPath: `${jobId}-depth.png`,
    normalPath: `${jobId}-normal.png`,
    materialIdMapPath: `${jobId}-material-ids.json`,
  };
}

export function stillJobSnapshotId(
  projectId: string,
  projectContentHash: string,
  cameraId: string,
) {
  return `${projectId}:${cameraId}:${projectContentHash}`;
}
