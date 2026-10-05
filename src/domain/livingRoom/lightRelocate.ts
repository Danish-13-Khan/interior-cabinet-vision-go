import type { InteriorProject } from "../interiorProject";
import { orientWallForRoom, selectRoomWalls } from "../interiorProject";
import { attachLightToWall, readLightMount } from "./lightAttachments";
import { wallLength } from "./wallSegmentPlacement";

type PointMm = { x: number; y: number; z: number };

function round(value: number) {
  return Math.round(value);
}

/**
 * Move a light to a point chosen in the 3D view, keeping its mount.
 * Wall: the point becomes a distance along the wall and a centre height.
 * Ceiling: x and z move, height stays with the room. Free: the point is the position.
 * A light fixed to a cabinet follows the cabinet and is not moved here.
 */
export function relocateLight(project: InteriorProject, lightId: string, point: PointMm): InteriorProject {
  const light = project.lights.find((item) => item.id === lightId && item.roomId === project.activeRoomId);
  if (!light || !light.roomId) return project;
  const mount = readLightMount(light);
  if (mount.kind === "object") return project;
  if (mount.kind === "wall") {
    const stored = selectRoomWalls(project, light.roomId).find((wall) => wall.id === mount.hostWallId);
    if (!stored) return project;
    const wall = orientWallForRoom(project, light.roomId, stored);
    const length = wallLength(wall);
    if (length < 1) return project;
    const ux = (wall.end.x - wall.start.x) / length;
    const uz = (wall.end.z - wall.start.z) / length;
    const along = (point.x - wall.start.x) * ux + (point.z - wall.start.z) * uz;
    return attachLightToWall(project, lightId, {
      hostWallId: mount.hostWallId,
      alongMm: round(Math.min(length, Math.max(0, along))),
      centerHeightMm: round(Math.min(wall.heightMm, Math.max(0, point.y))),
      wallSide: mount.wallSide,
      fitHostWidth: mount.fitHostWidth,
    });
  }
  const position = mount.kind === "ceiling"
    ? { ...light.position, x: round(point.x), z: round(point.z) }
    : { x: round(point.x), y: round(Math.max(0, point.y)), z: round(point.z) };
  return {
    ...project,
    lights: project.lights.map((item) => (item.id === lightId ? { ...item, position } : item)),
  };
}
