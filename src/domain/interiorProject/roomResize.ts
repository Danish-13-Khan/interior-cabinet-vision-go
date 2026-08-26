import { roomPlanPolygon, polygonBounds } from "./roomGeometry";
import { wallIdsForRoomLoops } from "./planTopology";
import { synchronizeRoomSurfaceZones } from "./roomSurfaces";
import { synchronizeWallCaches } from "./wallGraph";
import type { InteriorProject, Size3Mm } from "./types";

function wallLength(project: InteriorProject, wallId: string) {
  const wall = project.walls.find((item) => item.id === wallId);
  return wall ? Math.hypot(wall.end.x - wall.start.x, wall.end.z - wall.start.z) : 0;
}

function roundedMm(value: number) {
  return Math.round(value * 1_000_000) / 1_000_000;
}

/** Scale a room's graph envelope while keeping shared nodes and hosted openings coherent. */
export function resizeRoomPlanGeometry(
  project: InteriorProject,
  roomId: string,
  dimensions: Size3Mm,
): InteriorProject {
  const room = project.rooms.find((item) => item.id === roomId);
  const polygon = roomPlanPolygon(project, roomId);
  if (!room || !polygon) return project;
  const bounds = polygonBounds(polygon.outer);
  if (bounds.widthMm < 1 || bounds.depthMm < 1) return project;
  const widthMm = Math.max(2500, dimensions.widthMm);
  const depthMm = Math.max(2500, dimensions.depthMm);
  const heightMm = Math.max(2200, dimensions.heightMm);
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerZ = (bounds.minZ + bounds.maxZ) / 2;
  const scaleX = widthMm / bounds.widthMm;
  const scaleZ = depthMm / bounds.depthMm;
  const wallIds = wallIdsForRoomLoops(project, roomId);
  const nodeIds = new Set(project.walls.filter((wall) => wallIds.has(wall.id))
    .flatMap((wall) => [wall.startNodeId, wall.endNodeId]).filter((id): id is string => Boolean(id)));
  const oldLengths = new Map([...wallIds].map((wallId) => [wallId, wallLength(project, wallId)]));
  const resized = synchronizeWallCaches({
    ...project,
    nodes: project.nodes.map((node) => nodeIds.has(node.id) ? {
      ...node,
      position: {
        x: roundedMm(centerX + (node.position.x - centerX) * scaleX),
        z: roundedMm(centerZ + (node.position.z - centerZ) * scaleZ),
      },
    } : node),
    rooms: project.rooms.map((item) => item.id === roomId ? {
      ...item, dimensions: { widthMm, depthMm, heightMm },
    } : item),
    walls: project.walls.map((wall) => wallIds.has(wall.id)
      ? { ...wall, heightMm } : wall),
  });
  const openings = resized.openings.map((opening) => {
    const oldLength = oldLengths.get(opening.wallId);
    if (!oldLength || oldLength < 1) return opening;
    const newLength = wallLength(resized, opening.wallId);
    const ratio = newLength / oldLength;
    const width = roundedMm(Math.min(newLength, opening.widthMm * ratio));
    return {
      ...opening,
      widthMm: width,
      offsetMm: roundedMm(Math.max(0, Math.min(newLength - width, opening.offsetMm * ratio))),
    };
  });
  return synchronizeRoomSurfaceZones({ ...resized, openings });
}
