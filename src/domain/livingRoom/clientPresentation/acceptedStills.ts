import type { InteriorProject } from "../../interiorProject";
import { stillJobProjectContentHash } from "../stillJob/projectHash";
import type { StillProvenance } from "../stillJob/provenance";
import { liveProposalSceneBinding, proposalSceneBinding } from "../proposal/proposalRevision";
import type { ClientPresentationManifest } from "./buildPackage";

function matchesUnchangedFrozenScene(
  project: InteriorProject,
  provenance: StillProvenance,
): boolean {
  const frozen = proposalSceneBinding(project);
  const live = liveProposalSceneBinding(project);
  return frozen.sceneFingerprint === live.sceneFingerprint
    && provenance.projectContentHash === frozen.projectContentHash;
}

/** Accepted still bound to the current editable project snapshot. */
export function isPackageEligibleStill(
  project: InteriorProject,
  provenance: StillProvenance,
): boolean {
  return (
    provenance.acceptanceStatus === "accepted"
    && provenance.projectId === project.id
    && (
      provenance.projectContentHash === stillJobProjectContentHash(project)
      || matchesUnchangedFrozenScene(project, provenance)
    )
  );
}

export function filterPackageEligibleStills(
  project: InteriorProject,
  stills: StillProvenance[],
): StillProvenance[] {
  return stills.filter((item) => isPackageEligibleStill(project, item));
}

/** Only accepted stills for the current project snapshot may enter the package manifest. */
export function withAcceptedStillProvenance(
  manifest: ClientPresentationManifest,
  project: InteriorProject,
  stills: StillProvenance[],
): ClientPresentationManifest {
  return {
    ...manifest,
    acceptedStills: filterPackageEligibleStills(project, stills),
  };
}
