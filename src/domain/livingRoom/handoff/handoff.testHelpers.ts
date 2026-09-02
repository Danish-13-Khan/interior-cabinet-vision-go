import type { InteriorProject } from "../../interiorProject";
import { createGoldenCabinetSceneProject } from "../goldenCabinetScene";
import { freezeProposal } from "../proposal/freezeProposal";
import { createFrozenGoldenProposalProject } from "../proposal/goldenProposal";
import { recordProposalRelease } from "../proposal/proposalRelease";
import { approveEngineeringRevision } from "./handoffApprove";

const NOW = "2026-08-30T12:00:00.000Z";

export function asLivingRoomDocument(document: InteriorProject): InteriorProject {
  return {
    ...document,
    rooms: document.rooms.map((room, index) => (
      index === 0 ? { ...room, roomType: "living-room" as const } : room
    )),
  };
}

export function createApprovedHandoffProject(now = NOW): InteriorProject {
  return approveEngineeringRevision(
    recordProposalRelease(createFrozenGoldenProposalProject(now), now),
    now,
  );
}

export function createApprovedGoldenSceneProject(now = NOW): InteriorProject {
  return approveEngineeringRevision(
    recordProposalRelease(freezeProposal(createGoldenCabinetSceneProject(now), now), now),
    now,
  );
}
