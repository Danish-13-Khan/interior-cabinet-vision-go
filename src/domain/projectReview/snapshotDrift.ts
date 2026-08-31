import type { CabinetProject } from "../cabinetDimensions";
import { revisionFingerprintsEqual } from "./compare";
import { createRevisionFingerprint } from "./fingerprint";
import { collectLiveReviewIssues, getProjectReviewState } from "./operations";
import { createProductionPacketFingerprint } from "./productionFingerprint";

/** True when live design no longer matches the latest frozen revision. */
export function snapshotHasDesignDrift(project: CabinetProject): boolean {
  const review = getProjectReviewState(project);
  const snapshot = review.history[0];
  if (!snapshot) return false;
  const liveIssues = collectLiveReviewIssues(project, review.notes);
  const liveRevision = createRevisionFingerprint(project, liveIssues);
  if (!revisionFingerprintsEqual(liveRevision, snapshot.fingerprint)) return true;
  const livePacket = createProductionPacketFingerprint(project);
  if (snapshot.packetFingerprint) return snapshot.packetFingerprint !== livePacket;
  // Legacy snapshots predate PRD-047 and cannot prove that their packet inputs
  // still match. Require a fresh freeze instead of silently using the weaker
  // aggregate revision fingerprint.
  return true;
}
