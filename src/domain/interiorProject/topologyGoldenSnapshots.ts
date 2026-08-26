import type { InteriorProject } from "./types";

/** Stable topology slice for golden fixture comparisons. */
export function topologyGoldenSnapshot(project: InteriorProject) {
  return {
    extensions: project.extensions,
    nodes: project.nodes.map((node) => ({ id: node.id, position: node.position })),
    loops: project.loops.map((loop) => ({
      id: loop.id,
      wallUses: loop.wallUses.map((use) => ({ wallId: use.wallId, direction: use.direction })),
    })),
    rooms: project.rooms.map((room) => ({
      id: room.id,
      outerLoopId: room.outerLoopId,
      holeLoopIds: room.holeLoopIds ?? [],
    })),
    walls: project.walls.map((wall) => ({
      id: wall.id,
      roomId: wall.roomId ?? null,
      start: wall.start,
      end: wall.end,
      startNodeId: wall.startNodeId,
      endNodeId: wall.endNodeId,
    })),
    openings: project.openings.map((opening) => ({
      id: opening.id,
      wallId: opening.wallId,
      roomId: opening.roomId ?? null,
      offsetMm: opening.offsetMm,
      widthMm: opening.widthMm,
      catalogItemId: opening.catalogItemId,
    })),
  };
}
