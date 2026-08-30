import { createRevisionFingerprint } from "../../projectReview";
import type { InteriorProject } from "../../interiorProject";
import { readProposalCommercial } from "../proposal/commercialState";
import { handoffApprovalReady } from "./handoffApprove";
import { adaptHandoffProject, listHandoffCabinets } from "./handoffCabinets";
import { createHandoffDesignFingerprint } from "./handoffDesignFingerprint";
import { hasHandoffSnapshotForRevision, writeHandoffRecord } from "./handoffState";

export function commitEngineeringHandoff(
  document: InteriorProject,
  selectedInteriorObjectIds: string[] = [],
  now = new Date().toISOString(),
): InteriorProject {
  if (!handoffApprovalReady(document).ok) return document;
  const commercial = readProposalCommercial(document);
  if (hasHandoffSnapshotForRevision(document, commercial.job.revision)) return document;
  const adapted = adaptHandoffProject(document);
  return writeHandoffRecord(document, {
    handedOffAt: now,
    revision: commercial.job.revision,
    cabinetIds: listHandoffCabinets(adapted.project).map((cabinet) => cabinet.id),
    fingerprint: createRevisionFingerprint(adapted.project),
    designFingerprint: createHandoffDesignFingerprint(adapted.project),
    selectedInteriorObjectIds: [...selectedInteriorObjectIds],
  });
}
