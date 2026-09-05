import { createEmptyInteriorProject } from "../../domain/interiorProject/defaults";
import { drawRoomFromPoints } from "../../domain/interiorProject/roomDrawing";
import type { InteriorProject, Point2Mm } from "../../domain/interiorProject/types";
import type { GeminiFloorProposal, ProposalPoint } from "./proposalTypes";

export type MapProposalResult =
  | { ok: true; project: InteriorProject; warnings: string[] }
  | { ok: false; error: string };

/** Plan Y (proposal) → interior Z. */
export function proposalPointToInterior(p: ProposalPoint): Point2Mm {
  return { x: p.x, z: p.y };
}

function defaultThicknessMm(proposal: GeminiFloorProposal): number {
  const fromWall = proposal.walls.find((w) => w.thicknessMm && w.thicknessMm > 0)?.thicknessMm;
  return fromWall && fromWall > 0 ? fromWall : 120;
}

function applyHeightsAndNames(
  project: InteriorProject,
  proposal: GeminiFloorProposal,
  thicknessMm: number,
): InteriorProject {
  const heightMm = proposal.assumedWallHeightMm > 0 ? proposal.assumedWallHeightMm : 2700;
  const named = proposal.rooms.map((r) => r.name?.trim() || r.id);

  return {
    ...project,
    walls: project.walls.map((wall) => ({
      ...wall,
      heightMm,
      thicknessMm,
    })),
    rooms: project.rooms.map((room, index) => ({
      ...room,
      name: named[index] ?? room.name,
      wallThicknessMm: thicknessMm,
      dimensions: { ...room.dimensions, heightMm },
      extensions: {
        ...room.extensions,
        source: "gemini-floorplan-lab",
        proposalRoomId: proposal.rooms[index]?.id,
      },
    })),
  };
}

/**
 * Maps a reviewed Gemini proposal into a normal InteriorProject wall graph.
 * Uses drawRoomFromPoints so post-accept editing stays on the standard plan path.
 */
export function mapProposalToInteriorProject(
  proposal: GeminiFloorProposal,
  options: { projectId?: string; projectName?: string; now?: string } = {},
): MapProposalResult {
  if (proposal.units !== "mm") {
    return { ok: false, error: "Proposal must be normalized to mm before accept." };
  }
  if (!proposal.rooms.length) {
    return { ok: false, error: "Proposal has no rooms to accept." };
  }

  const warnings: string[] = [];
  if (proposal.scaleConfidence === "low") {
    warnings.push("Scale confidence is low — calibrate before using sizes in millwork.");
  }
  if (proposal.openings?.length) {
    warnings.push(
      `${proposal.openings.length} opening(s) were not imported — place doors/windows in the plan editor.`,
    );
  }

  const thicknessMm = defaultThicknessMm(proposal);
  const now = options.now ?? new Date().toISOString();
  let project = createEmptyInteriorProject({
    id: options.projectId ?? `gemini-lab-${Date.now()}`,
    name: options.projectName?.trim() || "Gemini floor-plan draft",
    now,
  });

  let roomsDrawn = 0;
  for (const room of proposal.rooms) {
    const points = room.outlineMm.map(proposalPointToInterior);
    const before = project.rooms.length;
    project = drawRoomFromPoints(project, { kind: "polygon", points }, { raised: false });
    if (project.rooms.length === before) {
      warnings.push(`Skipped room “${room.name || room.id}” — outline invalid or too small.`);
      continue;
    }
    roomsDrawn += 1;
  }

  if (roomsDrawn === 0) {
    return { ok: false, error: "No valid room outlines could be mapped." };
  }

  project = applyHeightsAndNames(project, proposal, thicknessMm);
  project = {
    ...project,
    updatedAt: now,
    extensions: {
      ...project.extensions,
      geminiFloorplanLab: {
        acceptedAt: now,
        scaleConfidence: proposal.scaleConfidence,
        notes: proposal.notes ?? [],
        sourceProposalUnits: proposal.units,
      },
    },
  };

  return { ok: true, project, warnings };
}
