import type { CabinetProject } from "../cabinetDimensions";
import { productionIdentityBlocked } from "../cabinetIdentity";
import { clampJobMeta } from "../jobMeta";
import { createRevisionFingerprint } from "./fingerprint";
import { getProjectReviewState } from "./operations";

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/** Stable packet fingerprint frozen onto a production release. */
export function createProductionPacketFingerprint(project: CabinetProject): string {
  const review = getProjectReviewState(project);
  const fingerprint = createRevisionFingerprint(project, review.notes);
  const job = clampJobMeta(project.job);
  const payload = [
    job.revision,
    job.projectNumber,
    [...project.cabinets.map((cabinet) => cabinet.id)].sort().join(","),
    fingerprint.cabinetCount,
    fingerprint.partLineCount,
    fingerprint.sellTotal,
    fingerprint.workshopTotal,
    fingerprint.materialKeys.join("|"),
    productionIdentityBlocked(project) ? "1" : "0",
  ].join("::");
  return `prd-pkt-v1-${hashString(payload)}`;
}
