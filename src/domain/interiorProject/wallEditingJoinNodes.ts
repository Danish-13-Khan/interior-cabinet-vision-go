import { synchronizeWallCaches } from "./wallGraph";
import { synchronizeRoomSurfaceZones } from "./roomSurfaces";
import type { InteriorProject, WallEntity } from "./types";
import { compatibleSharedEdge, pruneOrphanNodes } from "./wallEditingHelpers";

/** Merge two explicit graph nodes and collapse duplicate compatible edges created by the join. */
export function joinPlanNodes(
  project: InteriorProject,
  keepNodeId: string,
  removeNodeId: string,
): InteriorProject {
  if (keepNodeId === removeNodeId) return project;
  if (!project.nodes.some((node) => node.id === keepNodeId)) return project;
  if (!project.nodes.some((node) => node.id === removeNodeId)) return project;

  const walls = project.walls.map((wall) => ({
    ...wall,
    startNodeId: wall.startNodeId === removeNodeId ? keepNodeId : wall.startNodeId,
    endNodeId: wall.endNodeId === removeNodeId ? keepNodeId : wall.endNodeId,
  })).filter((wall) => wall.startNodeId && wall.endNodeId && wall.startNodeId !== wall.endNodeId);

  const wallIdMap = new Map<string, string>();
  const merged: WallEntity[] = [];
  for (const wall of walls) {
    const pairKey = wall.startNodeId! < wall.endNodeId!
      ? `${wall.startNodeId}|${wall.endNodeId}`
      : `${wall.endNodeId}|${wall.startNodeId}`;
    const existing = merged.find((candidate) => {
      const candidateKey = candidate.startNodeId! < candidate.endNodeId!
        ? `${candidate.startNodeId}|${candidate.endNodeId}`
        : `${candidate.endNodeId}|${candidate.startNodeId}`;
      return candidateKey === pairKey && compatibleSharedEdge(candidate, wall);
    });
    if (existing) {
      wallIdMap.set(wall.id, existing.id);
      continue;
    }
    merged.push(wall);
    wallIdMap.set(wall.id, wall.id);
  }

  const loops = project.loops.map((loop) => {
    const seen = new Set<string>();
    const wallUses = [];
    for (const use of loop.wallUses) {
      const mappedId = wallIdMap.get(use.wallId) ?? use.wallId;
      const key = `${mappedId}:${use.direction}`;
      if (seen.has(key)) continue;
      seen.add(key);
      wallUses.push({ wallId: mappedId, direction: use.direction });
    }
    return { ...loop, wallUses };
  });

  const openings = project.openings.map((opening) => ({
    ...opening,
    wallId: wallIdMap.get(opening.wallId) ?? opening.wallId,
  }));
  const nodes = project.nodes.filter((node) => node.id !== removeNodeId);

  return synchronizeRoomSurfaceZones(pruneOrphanNodes(synchronizeWallCaches({
    ...project,
    nodes,
    walls: merged,
    loops,
    openings,
  })));
}
