import type { GeminiFloorProposal } from "../proposalTypes";
import { assignRoomSides } from "./assignRoomSides";
import { bindOpeningsToWalls } from "./bindOpenings";
import { classifyWallTypes } from "./classifyWalls";
import type { ArchitecturalScene, ArchitecturalWall, MaterialHint } from "./archSceneTypes";
import { mapFixturesToCatalog } from "./cabinetMapping";
import { roomMaterialHints } from "./materials";
import { buildRoomSurfaces, findOpenLoops } from "./roomSurfaces";
import { traceRoomCycles } from "./roomCycles";
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
  const cycleOutlines = traceRoomCycles(topoWalls, junctions);
  const seedRooms =
    proposal.rooms.length > 0
      ? proposal.rooms.map((r) => ({
          id: r.id,
          name: r.name,
          outlineMm: r.outlineMm.map((p) => ({ ...p })),
          adjacentRoomIds: [] as string[],
          floorHeightMm: 0,
          ceilingHeightMm: proposal.assumedWallHeightMm || 2700,
        }))
      : cycleOutlines.map((outlineMm, i) => ({
          id: `cycle-room-${i + 1}`,
          name: `Room ${i + 1}`,
          outlineMm,
          adjacentRoomIds: [] as string[],
          floorHeightMm: 0,
          ceilingHeightMm: proposal.assumedWallHeightMm || 2700,
        }));

  // Merge topology cycles when Vision rooms lack outlines
  for (let i = 0; i < seedRooms.length; i++) {
    if (seedRooms[i].outlineMm.length < 3 && cycleOutlines[i]) {
      seedRooms[i] = { ...seedRooms[i], outlineMm: cycleOutlines[i] };
    }
  }

  const sided = assignRoomSides(topoWalls, seedRooms);
  const classified = classifyWallTypes(sided, junctions);
  const { walls, openings } = bindOpeningsToWalls(classified, proposal);
  const hints: MaterialHint[] = roomMaterialHints(seedRooms);

  let scene: ArchitecturalScene = {
    units: "mm",
    walls,
    wallJunctions: junctions,
    openings,
    rooms: seedRooms,
    floors: [],
    ceilings: [],
    fixtures: [],
    materialHints: hints,
    lightingPreset: "studio",
    skirtingMm: 100,
    notes: [...(proposal.notes ?? [])],
  };

  const surfaces = buildRoomSurfaces(scene);
  scene = { ...scene, rooms: surfaces.rooms, floors: surfaces.floors, ceilings: surfaces.ceilings };
  let fixtures = extractSemanticFixtures(proposal, scene);
  const catalog = mapFixturesToCatalog({ ...scene, fixtures });
  fixtures = fixtures.map((f) => {
    const hit = catalog.find((c) => c.fixtureId === f.id);
    return hit ? { ...f, catalogId: hit.catalogId } : f;
  });
  scene = { ...scene, fixtures };

  const openEnds = findOpenLoops(scene.walls);
  scene.notes.push(
    `Phase 7 topology: ${scene.walls.length} walls, ${scene.wallJunctions.length} junctions.`,
    `Phase 8 openings: ${scene.openings.length} wall-hosted.`,
    `Phase 9 rooms: ${scene.floors.length} floors · ${cycleOutlines.length} wall-cycles.`,
    `Phase 10 fixtures: ${scene.fixtures.length}.`,
  );
  if (openEnds.length) scene.notes.push(`Phase 9 open-loop endpoints: ${openEnds.length}.`);
  return scene;
}
