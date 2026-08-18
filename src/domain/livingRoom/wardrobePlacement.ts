import type { InteriorObjectEntity, InteriorProject, WallEntity } from "../interiorProject";

export type WallPlacement = {
  wallId: string;
  position: { x: number; y: number; z: number };
  rotationY: number;
};

function wallLength(wall: WallEntity) {
  return Math.hypot(wall.end.x - wall.start.x, wall.end.z - wall.start.z);
}

/** Resolves a cabinet against the room-facing side of a rectangular wall. */
export function placeOnWall(
  project: InteriorProject,
  object: InteriorObjectEntity,
  wallId: string,
): WallPlacement | null {
  const wall = project.walls.find((item) => item.id === wallId);
  if (!wall || wall.roomId !== object.roomId) return null;
  const length = wallLength(wall);
  if (length < 1) return null;
  const ux = (wall.end.x - wall.start.x) / length;
  const uz = (wall.end.z - wall.start.z) / length;
  // Walls are clockwise, so the left normal faces the interior.
  const nx = -uz;
  const nz = ux;
  const usableOffset = Math.max(object.dimensions.widthMm / 2, Math.min(length - object.dimensions.widthMm / 2, length / 2));
  const surfaceX = wall.start.x + ux * usableOffset;
  const surfaceZ = wall.start.z + uz * usableOffset;
  return {
    wallId,
    position: {
      x: surfaceX + nx * (wall.thicknessMm / 2 + object.dimensions.depthMm / 2),
      y: 0,
      z: surfaceZ + nz * (wall.thicknessMm / 2 + object.dimensions.depthMm / 2),
    },
    rotationY: Math.round((Math.atan2(nx, nz) * 180) / Math.PI) || 0,
  };
}

export function attachToWall(
  project: InteriorProject,
  object: InteriorObjectEntity,
  wallId: string,
) {
  const placement = placeOnWall(project, object, wallId);
  if (!placement) return object;
  return {
    ...object,
    position: placement.position,
    rotation: { ...object.rotation, y: placement.rotationY },
    extensions: { ...object.extensions, wallAttachment: { wallId } },
  };
}
