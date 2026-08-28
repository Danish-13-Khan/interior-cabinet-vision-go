import type { InteriorObjectEntity, WallEntity } from "../interiorProject";

export type WallPlacement = {
  wallId: string;
  position: { x: number; y: number; z: number };
  rotationY: number;
};

export function wallLength(wall: WallEntity) {
  return Math.hypot(wall.end.x - wall.start.x, wall.end.z - wall.start.z);
}

export function placementAt(wall: WallEntity, object: InteriorObjectEntity, offsetMm: number): WallPlacement {
  const length = wallLength(wall);
  const ux = (wall.end.x - wall.start.x) / length;
  const uz = (wall.end.z - wall.start.z) / length;
  const nx = -uz;
  const nz = ux;
  const clamped = Math.max(object.dimensions.widthMm / 2, Math.min(length - object.dimensions.widthMm / 2, offsetMm));
  return {
    wallId: wall.id,
    position: {
      x: wall.start.x + ux * clamped + nx * (wall.thicknessMm / 2 + object.dimensions.depthMm / 2),
      y: 0,
      z: wall.start.z + uz * clamped + nz * (wall.thicknessMm / 2 + object.dimensions.depthMm / 2),
    },
    rotationY: Math.round((Math.atan2(nx, nz) * 180) / Math.PI) || 0,
  };
}

export function attached(object: InteriorObjectEntity, placement: WallPlacement) {
  return {
    ...object,
    position: placement.position,
    rotation: { ...object.rotation, y: placement.rotationY },
    extensions: { ...object.extensions, wallAttachment: { wallId: placement.wallId } },
  };
}
