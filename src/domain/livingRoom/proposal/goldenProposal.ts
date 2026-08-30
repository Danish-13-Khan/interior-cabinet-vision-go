import { createDefaultJobMeta } from "../../jobMeta";
import type { InteriorProject } from "../../interiorProject";
import { createGoldenCabinetSceneProject } from "../goldenCabinetScene";
import { writeProposalCommercial } from "./commercialState";
import { freezeProposal } from "./freezeProposal";
import { proposalExportViews, proposalSceneBinding } from "./proposalRevision";
import type { ProposalViewFrame } from "./types";

/** Opaque 16×12 crimson still so PDF.js can prove the view XObject painted. */
export const PROPOSAL_TEST_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAMCAYAAABr5z2BAAAAAXNSR0IArs4c6QAAAARzQklUCAgICHwIZIgAAAAbSURBVCiRY3wo6/GfgQLARInmUQNGDRg8BgAADFICXXvqF4oAAAAASUVORK5CYII=";

const NOW = "2026-08-30T10:00:00.000Z";

export function createGoldenProposalProject(now = NOW): InteriorProject {
  const golden = createGoldenCabinetSceneProject(now);
  const roomId = golden.activeRoomId || golden.rooms[0]?.id || "room";
  const camera = golden.cameras[0] ?? {
    id: "proposal-hero",
    roomId,
    name: "Hero perspective",
    position: { x: 0, y: 1600, z: 3200 },
    target: { x: 0, y: 900, z: 0 },
    fieldOfViewDegrees: 40,
    isDefault: true,
  };
  const withIdentity = writeProposalCommercial({
    ...golden,
    cameras: golden.cameras.length ? golden.cameras : [camera],
    renderSettings: {
      ...golden.renderSettings,
      packageCameraBookmarks: [
        { cameraId: camera.id, viewName: "Hero perspective" },
      ],
    },
  }, {
    job: createDefaultJobMeta({
      customerName: "Rivera Residence",
      projectNumber: "JOB-317",
      revision: "A",
      quotedAt: now,
    }),
  });
  return withIdentity;
}

export function createFrozenGoldenProposalProject(now = NOW): InteriorProject {
  return freezeProposal(createGoldenProposalProject(now), now);
}

export function goldenProposalViewFrame(document: InteriorProject): ProposalViewFrame {
  const frame = goldenProposalViewFrames(document)[0];
  if (!frame) throw new Error("Golden proposal has no selected view.");
  return frame;
}

export function goldenProposalViewFrames(document: InteriorProject): ProposalViewFrame[] {
  const binding = proposalSceneBinding(document);
  return proposalExportViews(document).map((view) => ({
    cameraId: view.cameraId,
    viewName: view.viewName,
    dataUrl: PROPOSAL_TEST_PNG,
    projectId: binding.projectId,
    sceneFingerprint: binding.sceneFingerprint,
    projectContentHash: binding.projectContentHash,
  }));
}
