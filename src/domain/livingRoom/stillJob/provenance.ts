import type { StillJob, StillJobAllowedEnhancement, StillJobEngine, StillJobMode } from "./types";

export type StillAcceptanceStatus = "pending" | "accepted" | "rejected";

/** Package / QA record for a still. Never written back into InteriorProject. */
export type StillProvenance = {
  schemaVersion: number;
  jobId: string;
  projectId: string;
  projectContentHash: string;
  snapshotId: string;
  cameraId: string;
  engine: StillJobEngine;
  seed: number;
  allowedEnhancements: StillJobAllowedEnhancement[];
  mode: StillJobMode;
  acceptanceStatus: StillAcceptanceStatus;
  acceptedAt?: string;
  stillOutputPath?: string;
  heroPlatePath?: string;
};

export function buildStillProvenance(
  job: StillJob,
  acceptanceStatus: StillAcceptanceStatus,
  extras: {
    acceptedAt?: string;
    stillOutputPath?: string;
    heroPlatePath?: string;
  } = {},
): StillProvenance {
  return {
    schemaVersion: job.schemaVersion,
    jobId: job.jobId,
    projectId: job.projectId,
    projectContentHash: job.projectContentHash,
    snapshotId: job.snapshotId,
    cameraId: job.cameraId,
    engine: { ...job.engine },
    seed: job.seed,
    allowedEnhancements: [...job.allowedEnhancements],
    mode: job.mode,
    acceptanceStatus,
    acceptedAt: extras.acceptedAt,
    stillOutputPath: extras.stillOutputPath,
    heroPlatePath: extras.heroPlatePath ?? job.attachments.heroPngPath,
  };
}

export function acceptedStillProvenance(stills: StillProvenance[]) {
  return stills.filter((item) => item.acceptanceStatus === "accepted");
}
