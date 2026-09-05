import type { GeminiFloorProposal } from "../proposalTypes";
import { assignRoomSides } from "./assignRoomSides";
import { classifyWallTypes } from "./classifyWalls";
import type { ArchitecturalScene, ArchitecturalWall } from "./archSceneTypes";
import { buildWallTopology } from "./wallTopology";

function proposalWallsToArch(proposal: GeminiFloorProposal): ArchitecturalWall[] {
  const heightMm = proposal.assumedWallHeightMm > 0 ? proposal.assumedWallHeightMm : 2700;
  return proposal.walls.map((w) => ({
    id: w.id,
    start: { ...w.a },
    end: { ...w.b },
    thicknessMm: w.thicknessMm && w.thicknessMm > 0 ? w.thicknessMm : 100,
    heightMm,
    type: "unknown" as const,
    openingIds: [],
    confidence: "medium" as const,
  }));
}

/** Phase 7: proposal → architectural scene with wall topology. */
export function proposalToArchScene(proposal: GeminiFloorProposal): ArchitecturalScene {
  const rawWalls = proposalWallsToArch(proposal);
  const { walls: topoWalls, junctions } = buildWallTopology(rawWalls);
  const rooms = proposal.rooms.map((r) => ({
    id: r.id,
    name: r.name,
    outlineMm: r.outlineMm.map((p) => ({ ...p })),
    adjacentRoomIds: [] as string[],
    floorHeightMm: 0,
    ceilingHeightMm: proposal.assumedWallHeightMm || 2700,
  }));
  const sided = assignRoomSides(topoWalls, rooms);
  const walls = classifyWallTypes(sided, junctions);

  return {
    units: "mm",
    walls,
    wallJunctions: junctions,
    openings: [],
    rooms,
    floors: [],
    ceilings: [],
    fixtures: [],
    notes: [
      ...(proposal.notes ?? []),
      `Phase 7 topology: ${walls.length} walls, ${junctions.length} junctions.`,
    ],
  };
}
