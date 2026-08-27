import { wallLengthMm } from "./planTopology";
import { synchronizeWallCaches } from "./wallGraph";
import { synchronizeRoomSurfaceZones } from "./roomSurfaces";
import type { InteriorProject, OpeningEntity, WallEntity } from "./types";
import {
  MIN_SEGMENT_MM,
  cloneNodes,
  ensureNode,
  nextId,
  pruneOrphanNodes,
  replaceWallUse,
} from "./wallEditingHelpers";

export type SplitPlanWallResult = {
  project: InteriorProject;
  firstWallId: string;
  secondWallId: string;
};

function remapSpanningOpening(
  opening: OpeningEntity,
  firstId: string,
  secondId: string,
  clamped: number,
  usedOpeningIds: Set<string>,
): OpeningEntity[] {
  const firstWidth = clamped - opening.offsetMm;
  const secondWidth = opening.offsetMm + opening.widthMm - clamped;
  if (firstWidth <= 0) {
    return [{ ...opening, wallId: secondId, offsetMm: opening.offsetMm - clamped, widthMm: secondWidth }];
  }
  if (secondWidth <= 0) {
    return [{ ...opening, wallId: firstId, widthMm: firstWidth }];
  }
  return [
    { ...opening, wallId: firstId, widthMm: firstWidth },
    {
      ...opening,
      id: nextId("opening", usedOpeningIds),
      wallId: secondId,
      offsetMm: 0,
      widthMm: secondWidth,
    },
  ];
}

/** Split a wall at an offset from its start node; openings stay on or split across segments. */
export function splitPlanWall(
  project: InteriorProject,
  wallId: string,
  offsetMm = wallLengthMm(project.walls.find((wall) => wall.id === wallId) ?? { start: { x: 0, z: 0 }, end: { x: 0, z: 0 } }) / 2,
): InteriorProject {
  return splitPlanWallResult(project, wallId, offsetMm).project;
}

export function splitPlanWallResult(
  project: InteriorProject,
  wallId: string,
  offsetMm = wallLengthMm(project.walls.find((wall) => wall.id === wallId) ?? { start: { x: 0, z: 0 }, end: { x: 0, z: 0 } }) / 2,
): SplitPlanWallResult {
  const wall = project.walls.find((item) => item.id === wallId);
  if (!wall?.startNodeId || !wall.endNodeId) {
    return { project, firstWallId: wallId, secondWallId: wallId };
  }
  const length = wallLengthMm(wall);
  const clamped = Math.min(Math.max(offsetMm, MIN_SEGMENT_MM), length - MIN_SEGMENT_MM);
  if (clamped <= 0 || clamped >= length) {
    return { project, firstWallId: wallId, secondWallId: wallId };
  }

  const ratio = clamped / length;
  const splitPoint = {
    x: wall.start.x + (wall.end.x - wall.start.x) * ratio,
    z: wall.start.z + (wall.end.z - wall.start.z) * ratio,
  };
  const { nodes, nodeByPoint, usedNodeIds } = cloneNodes(project);
  const splitNodeId = ensureNode(splitPoint, nodes, nodeByPoint, usedNodeIds);
  const usedWallIds = new Set(project.walls.map((item) => item.id));
  const firstId = nextId("wall", usedWallIds);
  const secondId = nextId("wall", usedWallIds);
  const first: WallEntity = { ...wall, id: firstId, end: { ...splitPoint }, endNodeId: splitNodeId };
  const second: WallEntity = { ...wall, id: secondId, start: { ...splitPoint }, startNodeId: splitNodeId };

  const loops = project.loops.map((loop) => {
    const use = loop.wallUses.find((item) => item.wallId === wallId);
    if (!use) return loop;
    const replacements = use.direction === "forward"
      ? [{ wallId: firstId, direction: "forward" as const }, { wallId: secondId, direction: "forward" as const }]
      : [{ wallId: secondId, direction: "reverse" as const }, { wallId: firstId, direction: "reverse" as const }];
    return replaceWallUse(loop, wallId, replacements);
  });

  const usedOpeningIds = new Set(project.openings.map((opening) => opening.id));
  const openings = project.openings.flatMap((opening) => {
    if (opening.wallId !== wallId) return [opening];
    if (opening.offsetMm + opening.widthMm <= clamped) return [{ ...opening, wallId: firstId }];
    if (opening.offsetMm >= clamped) {
      return [{ ...opening, wallId: secondId, offsetMm: opening.offsetMm - clamped }];
    }
    return remapSpanningOpening(opening, firstId, secondId, clamped, usedOpeningIds);
  });

  const walls = project.walls.flatMap((item) => item.id === wallId ? [first, second] : [item]);
  const next = synchronizeRoomSurfaceZones(pruneOrphanNodes(synchronizeWallCaches({ ...project, nodes, walls, loops, openings })));
  return { project: next, firstWallId: firstId, secondWallId: secondId };
}

/** Delete a wall when every affected loop keeps at least three uses. */
export function deletePlanWall(project: InteriorProject, wallId: string): InteriorProject {
  if (!project.walls.some((wall) => wall.id === wallId)) return project;
  for (const loop of project.loops) {
    const uses = loop.wallUses.filter((use) => use.wallId === wallId);
    if (uses.length > 0 && loop.wallUses.length - uses.length < 3) return project;
  }
  const loops = project.loops.map((loop) => ({
    ...loop,
    wallUses: loop.wallUses.filter((use) => use.wallId !== wallId),
  }));
  const openings = project.openings.filter((opening) => opening.wallId !== wallId);
  const walls = project.walls.filter((wall) => wall.id !== wallId);
  return synchronizeRoomSurfaceZones(pruneOrphanNodes(synchronizeWallCaches({ ...project, walls, loops, openings })));
}

export function setPlanWallThickness(
  project: InteriorProject,
  wallId: string,
  thicknessMm: number,
): InteriorProject {
  const thickness = Math.max(50, Math.min(500, Math.round(thicknessMm)));
  return synchronizeWallCaches({
    ...project,
    walls: project.walls.map((wall) => wall.id === wallId ? { ...wall, thicknessMm: thickness } : wall),
  });
}
