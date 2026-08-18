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

function placementAt(wall: WallEntity, object: InteriorObjectEntity, offsetMm: number): WallPlacement {
  const length = wallLength(wall);
  const ux = (wall.end.x - wall.start.x) / length;
  const uz = (wall.end.z - wall.start.z) / length;
  const nx = -uz;
  const nz = ux;
  const clamped = Math.max(object.dimensions.widthMm / 2, Math.min(length - object.dimensions.widthMm / 2, offsetMm));
  return {
    wallId: wall.id,
    position: { x: wall.start.x + ux * clamped + nx * (wall.thicknessMm / 2 + object.dimensions.depthMm / 2), y: 0, z: wall.start.z + uz * clamped + nz * (wall.thicknessMm / 2 + object.dimensions.depthMm / 2) },
    rotationY: Math.round((Math.atan2(nx, nz) * 180) / Math.PI) || 0,
  };
}

function attached(object: InteriorObjectEntity, placement: WallPlacement) {
  return { ...object, position: placement.position, rotation: { ...object.rotation, y: placement.rotationY }, extensions: { ...object.extensions, wallAttachment: { wallId: placement.wallId } } };
}

export function snapCabinetToWall(project: InteriorProject, object: InteriorObjectEntity, desired: { x: number; y: number; z: number }) {
  if (object.kind !== "cabinet") return { ...object, position: desired };
  const nearest = project.walls
    .filter((wall) => wall.roomId === object.roomId)
    .map((wall) => {
      const length = wallLength(wall);
      const ux = (wall.end.x - wall.start.x) / length;
      const uz = (wall.end.z - wall.start.z) / length;
      const offset = (desired.x - wall.start.x) * ux + (desired.z - wall.start.z) * uz;
      const px = wall.start.x + ux * offset;
      const pz = wall.start.z + uz * offset;
      return { wall, offset, distance: Math.hypot(desired.x - px, desired.z - pz) };
    })
    .sort((a, b) => a.distance - b.distance)[0];
  if (!nearest || nearest.distance > object.dimensions.depthMm + 350) return { ...object, position: desired };
  return attached(object, placementAt(nearest.wall, object, nearest.offset));
}

export function arrangeCabinetRun(project: InteriorProject, objectIds: string[], wallId: string) {
  const wall = project.walls.find((item) => item.id === wallId);
  const cabinets = project.objects.filter((object) => objectIds.includes(object.id) && object.kind === "cabinet");
  if (!wall || cabinets.length < 2) return project;
  const total = cabinets.reduce((sum, object) => sum + object.dimensions.widthMm, 0);
  let cursor = Math.max(0, (wallLength(wall) - total) / 2);
  const arranged = new Map(cabinets.map((object) => {
    cursor += object.dimensions.widthMm / 2;
    const value = attached(object, placementAt(wall, object, cursor));
    cursor += object.dimensions.widthMm / 2;
    return [object.id, value];
  }));
  return { ...project, objects: project.objects.map((object) => arranged.get(object.id) ?? object) };
}
