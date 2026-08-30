import type { InteriorProject } from "../../interiorProject";
import type { LivingRoomRenderResult } from "../renderStudio";
import {
  proposalExportViews,
  proposalSceneBinding,
  stillMatchesProposalRevision,
  type ProposalSceneBinding,
} from "./proposalRevision";
import type { ProposalNamedView, ProposalViewFrame } from "./types";

export type ProposalViewFrameSource = {
  latestRender?: LivingRoomRenderResult | null;
  acceptedStills?: Array<{
    provenance: {
      cameraId: string;
      projectId?: string;
      projectContentHash?: string;
      acceptanceStatus?: string;
    };
    stillDataUrl: string;
  }>;
};

function frameMatchesBinding(frame: ProposalViewFrame, binding: ProposalSceneBinding) {
  if (!frame.dataUrl.trim()) return false;
  if ((frame.projectId || binding.projectId) !== binding.projectId) return false;
  if (!frame.sceneFingerprint || frame.sceneFingerprint !== binding.sceneFingerprint) return false;
  if (frame.projectContentHash && frame.projectContentHash !== binding.projectContentHash) {
    return false;
  }
  return true;
}

function acceptFrame(
  frames: Map<string, ProposalViewFrame>,
  views: ProposalNamedView[],
  binding: ProposalSceneBinding,
  cameraId: string,
  dataUrl: string,
  extras: Pick<ProposalViewFrame, "projectId" | "sceneFingerprint" | "projectContentHash">,
) {
  const view = views.find((item) => item.cameraId === cameraId);
  if (!view || frames.has(cameraId)) return;
  const frame: ProposalViewFrame = {
    cameraId,
    viewName: view.viewName,
    dataUrl,
    projectId: extras.projectId ?? binding.projectId,
    sceneFingerprint: extras.sceneFingerprint,
    projectContentHash: extras.projectContentHash,
  };
  if (!frameMatchesBinding(frame, binding)) return;
  frames.set(cameraId, frame);
}

/** Frames bound to the same view set and scene revision the proposal document will print. */
export function collectProposalViewFrames(
  document: InteriorProject,
  sources: ProposalViewFrameSource = {},
): ProposalViewFrame[] {
  const views = proposalExportViews(document);
  const binding = proposalSceneBinding(document);
  const frames = new Map<string, ProposalViewFrame>();
  for (const still of sources.acceptedStills ?? []) {
    if (!stillMatchesProposalRevision(document, still.provenance, binding)) continue;
    acceptFrame(frames, views, binding, still.provenance.cameraId, still.stillDataUrl, {
      projectId: still.provenance.projectId ?? binding.projectId,
      sceneFingerprint: binding.sceneFingerprint,
      projectContentHash: binding.projectContentHash,
    });
  }
  const render = sources.latestRender;
  if (render) {
    acceptFrame(frames, views, binding, render.cameraId, render.dataUrl, {
      projectId: render.projectId,
      sceneFingerprint: render.sceneFingerprint,
      projectContentHash: binding.projectContentHash,
    });
  }
  return views.flatMap((view) => {
    const frame = frames.get(view.cameraId);
    return frame ? [frame] : [];
  });
}

export function matchingProposalViewFrames(
  document: InteriorProject,
  frames: ProposalViewFrame[] | undefined,
): ProposalViewFrame[] {
  const views = proposalExportViews(document);
  const binding = proposalSceneBinding(document);
  const allowed = new Set(views.map((view) => view.cameraId));
  const seen = new Set<string>();
  return (frames ?? []).filter((frame) => {
    if (!allowed.has(frame.cameraId) || seen.has(frame.cameraId)) return false;
    if (!frameMatchesBinding(frame, binding)) return false;
    seen.add(frame.cameraId);
    return true;
  });
}

export function missingProposalViewCaptures(
  document: InteriorProject,
  frames: ProposalViewFrame[] | undefined,
): ProposalNamedView[] {
  const matched = new Set(matchingProposalViewFrames(document, frames).map((frame) => frame.cameraId));
  return proposalExportViews(document).filter((view) => !matched.has(view.cameraId));
}
