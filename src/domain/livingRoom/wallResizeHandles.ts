import { polygonCentroid, roomPlanPolygon, selectRoomWalls, type InteriorProject, type Point2Mm } from "../interiorProject";
import { isLoopContiguous } from "../interiorProject/planTopology";
import { isWallRaised } from "../interiorProject/wallRaise";

export type WallResizeHandleSpec = {
  wallId: string;
  start: Point2Mm;
  end: Point2Mm;
  heightMm: number;
  /** Unit vector pointing out of the room, in plan x/z. */
  outward: Point2Mm;
  label: string;
};

/**
 * Walls of the active room that get a 3D face handle: raised, visible, on the
 * outer loop. `outward` is the normal that points away from the room's centroid,
 * so dragging along it grows the room.
 */
export function wallResizeHandleSpecs(project: InteriorProject): WallResizeHandleSpec[] {
  const room = project.rooms.find((item) => item.id === project.activeRoomId);
  const polygon = room ? roomPlanPolygon(project, room.id) : null;
  const loop = room ? project.loops.find((item) => item.id === room.outerLoopId) : null;
  if (!room || !polygon || !loop || !isLoopContiguous(loop, new Map(project.walls.map((wall) => [wall.id, wall])))) return [];
  const centroid = polygonCentroid(polygon.outer);
  const onLoop = new Set(loop.wallUses.map((use) => use.wallId));
  return selectRoomWalls(project, room.id)
    .filter((wall) => wall.visible && isWallRaised(wall) && onLoop.has(wall.id))
    .map((wall) => {
      const dx = wall.end.x - wall.start.x; const dz = wall.end.z - wall.start.z;
      const length = Math.hypot(dx, dz) || 1;
      const candidate = { x: -dz / length, z: dx / length };
      const mid = { x: (wall.start.x + wall.end.x) / 2, z: (wall.start.z + wall.end.z) / 2 };
      const away = (mid.x + candidate.x - centroid.x) ** 2 + (mid.z + candidate.z - centroid.z) ** 2
        > (mid.x - candidate.x - centroid.x) ** 2 + (mid.z - candidate.z - centroid.z) ** 2;
      const outward = away ? candidate : { x: -candidate.x, z: -candidate.z };
      const side = typeof wall.extensions?.wallSide === "string" ? wall.extensions.wallSide : wall.id;
      return { wallId: wall.id, start: { ...wall.start }, end: { ...wall.end }, heightMm: wall.heightMm, outward, label: `${side} wall` };
    });
}
