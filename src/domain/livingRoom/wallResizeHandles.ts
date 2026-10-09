import {
  polygonSignedArea, roomPlanPolygon, selectRoomWalls, type InteriorProject, type Point2Mm, type WallEntity,
} from "../interiorProject";
import { isLoopContiguous } from "../interiorProject/planTopology";
import { isWallRaised } from "../interiorProject/wallRaise";

export type WallResizeHandleSpec = {
  wallId: string;
  start: Point2Mm;
  end: Point2Mm;
  heightMm: number;
  /** Unit vector pointing out of the room, in plan x/z. Null for a wall that is not on the outer loop. */
  outward: Point2Mm | null;
  /** On the outer loop: a face plate (one-sided room resize). Off it: end knobs (length change). */
  onLoop: boolean;
  label: string;
};

function unit(dx: number, dz: number) {
  const length = Math.hypot(dx, dz) || 1;
  return { x: dx / length, z: dz / length };
}

/**
 * Walls of the active room that get 3D handles: raised and visible. Outer-loop
 * walls get a face plate whose `outward` comes from the loop's winding (exact
 * for L-rooms, unlike a centroid test); partitions and free walls get end knobs,
 * since changing an outer wall's length would skew the room.
 */
export function wallResizeHandleSpecs(project: InteriorProject): WallResizeHandleSpec[] {
  const room = project.rooms.find((item) => item.id === project.activeRoomId);
  const polygon = room ? roomPlanPolygon(project, room.id) : null;
  const loop = room ? project.loops.find((item) => item.id === room.outerLoopId) : null;
  const wallsById = new Map(project.walls.map((wall) => [wall.id, wall]));
  if (!room || !polygon || !loop || !isLoopContiguous(loop, wallsById)) return [];
  // Interior lies to the left of travel when the ordered outline has positive signed area.
  const interiorLeft = polygonSignedArea(polygon.outer) > 0;
  const uses = new Map(loop.wallUses.map((use) => [use.wallId, use.direction]));
  const outwardOf = (wall: WallEntity) => {
    const direction = uses.get(wall.id);
    if (!direction) return null;
    const d = direction === "forward"
      ? unit(wall.end.x - wall.start.x, wall.end.z - wall.start.z)
      : unit(wall.start.x - wall.end.x, wall.start.z - wall.end.z);
    const left = { x: -d.z, z: d.x };
    return interiorLeft ? { x: -left.x, z: -left.z } : left;
  };
  return selectRoomWalls(project, room.id)
    .filter((wall) => wall.visible && isWallRaised(wall))
    .map((wall) => {
      const outward = outwardOf(wall);
      const side = typeof wall.extensions?.wallSide === "string" ? wall.extensions.wallSide : wall.id;
      return {
        wallId: wall.id, start: { ...wall.start }, end: { ...wall.end }, heightMm: wall.heightMm,
        outward, onLoop: outward !== null, label: outward ? `${side} wall` : (wall.extensions?.isPartition ? "partition" : "wall"),
      };
    });
}
