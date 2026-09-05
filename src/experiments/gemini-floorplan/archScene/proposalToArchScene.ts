import type { GeminiFloorProposal } from "../proposalTypes";
import { assignRoomSides } from "./assignRoomSides";
import { bindOpeningsToWalls } from "./bindOpenings";
import { classifyWallTypes } from "./classifyWalls";
import type { ArchitecturalScene, ArchitecturalWall } from "./archSceneTypes";
import { buildRoomSurfaces, findOpenLoops } from "./roomSurfaces";
import { extractSemanticFixtures } from "./semanticFixtures";
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

/** Full reconstruction pipeline Phases 7–10 into ArchitecturalScene. */
export function proposalToArchScene(proposal: GeminiFloorProposal): ArchitecturalScene {
  const rawWalls = proposalWallsToArch(proposal);
  const { walls: topoWalls, junctions } = buildWallTopology(rawWalls);
  const seedRooms = proposal.rooms.map((r) => ({
    id: r.id,
    name: r.name,
    outlineMm: r.outlineMm.map((p) => ({ ...p })),
    adjacentRoomIds: [] as string[],
    floorHeightMm: 0,
    ceilingHeightMm: proposal.assumedWallHeightMm || 2700,
  }));
  const sided = assignRoomSides(topoWalls, seedRooms);
  const classified = classifyWallTypes(sided, junctions);
  const { walls, openings } = bindOpeningsToWalls(classified, proposal);

  let scene: ArchitecturalScene = {
    units: "mm",
    walls,
    wallJunctions: junctions,
    openings,
    rooms: seedRooms,
    floors: [],
    ceilings: [],
    fixtures: [],
    notes: [...(proposal.notes ?? [])],
  };

  const surfaces = buildRoomSurfaces(scene);
  scene = {
    ...scene,
    rooms: surfaces.rooms,
    floors: surfaces.floors,
    ceilings: surfaces.ceilings,
  };
  scene = {
    ...scene,
    fixtures: extractSemanticFixtures(proposal, scene),
  };

  const openEnds = findOpenLoops(scene.walls);
  scene.notes.push(
    `Phase 7 topology: ${scene.walls.length} walls, ${scene.wallJunctions.length} junctions.`,
    `Phase 8 openings: ${scene.openings.length} wall-hosted.`,
    `Phase 9 rooms: ${scene.floors.length} floors / ${scene.ceilings.length} ceilings.`,
    `Phase 10 fixtures: ${scene.fixtures.length}.`,
  );
  if (openEnds.length) {
    scene.notes.push(`Phase 9 open-loop endpoints: ${openEnds.length}.`);
  }
  return scene;
}
