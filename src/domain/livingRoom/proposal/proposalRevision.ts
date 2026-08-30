import type { InteriorProject } from "../../interiorProject";
import { compileLivingRoomScene } from "../sceneCompiler";
import { stillJobProjectContentHash } from "../stillJob/projectHash";
import { readProposalCommercial } from "./commercialState";
import { buildLiveInteriorQuote } from "./liveQuote";
import { selectedProposalViews } from "./proposalViews";
import type { ProposalClientPayload, ProposalNamedView } from "./types";

export type ProposalSceneBinding = {
  projectId: string;
  sceneFingerprint: string;
  projectContentHash: string;
};

export function liveProposalSceneBinding(document: InteriorProject): ProposalSceneBinding {
  return {
    projectId: document.id,
    sceneFingerprint: compileLivingRoomScene(document).fingerprint,
    projectContentHash: stillJobProjectContentHash(document),
  };
}

export function matchingFrozenClient(document: InteriorProject): ProposalClientPayload | null {
  const live = buildLiveInteriorQuote(document);
  const stored = readProposalCommercial(document).surface.frozenClient;
  if (stored && live.frozen && stored.snapshotId === live.frozen.id) return stored;
  return null;
}

/** Views the proposal document will print — frozen payload when it matches the snapshot. */
export function proposalExportViews(document: InteriorProject): ProposalNamedView[] {
  const stored = matchingFrozenClient(document);
  if (stored?.views.length) return stored.views.filter((view) => view.selected);
  return selectedProposalViews(document);
}

/** Scene the exported proposal represents — frozen revision when the payload matches. */
export function proposalSceneBinding(document: InteriorProject): ProposalSceneBinding {
  const stored = matchingFrozenClient(document);
  if (stored?.sceneFingerprint && stored.projectContentHash) {
    return {
      projectId: document.id,
      sceneFingerprint: stored.sceneFingerprint,
      projectContentHash: stored.projectContentHash,
    };
  }
  return liveProposalSceneBinding(document);
}

/**
 * Bind a still to the exported revision without requiring the self-referential
 * pre-append project hash. Post-freeze stills hash the mutated document; they
 * match when the live visual scene is still the frozen scene.
 */
export function stillMatchesProposalRevision(
  document: InteriorProject,
  provenance: {
    projectId?: string;
    projectContentHash?: string;
    acceptanceStatus?: string;
  },
  binding: ProposalSceneBinding,
): boolean {
  if (provenance.acceptanceStatus !== "accepted" || !provenance.projectContentHash) return false;
  if ((provenance.projectId || binding.projectId) !== binding.projectId) return false;
  if (provenance.projectContentHash === binding.projectContentHash) return true;
  const live = liveProposalSceneBinding(document);
  return live.sceneFingerprint === binding.sceneFingerprint
    && provenance.projectContentHash === live.projectContentHash;
}
