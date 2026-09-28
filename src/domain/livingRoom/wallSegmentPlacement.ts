import type { InteriorObjectEntity, WallEntity } from "../interiorProject";
import { resolveWallMountHeightMm } from "./cabinetSceneMount";

export type WallPlacement = {
  wallId: string;
  position: { x: number; y: number; z: number };
  rotationY: number;
};

export function wallLength(wall: WallEntity) {
  return Math.hypot(wall.end.x - wall.start.x, wall.end.z - wall.start.z);
}

/** standOffMm moves the object off the wall face, e.g. to align a filler with deeper cabinet fronts. */
export function placementAt(wall: WallEntity, object: InteriorObjectEntity, offsetMm: number, standOffMm = 0): WallPlacement {
  const length = wallLength(wall);
  const ux = (wall.end.x - wall.start.x) / length;
  const uz = (wall.end.z - wall.start.z) / length;
  const nx = -uz;
  const nz = ux;
  const clamped = Math.max(object.dimensions.widthMm / 2, Math.min(length - object.dimensions.widthMm / 2, offsetMm));
  return {
    wallId: wall.id,
    position: {
      x: wall.start.x + ux * clamped + nx * (wall.thicknessMm / 2 + standOffMm + object.dimensions.depthMm / 2),
      y: resolveWallMountHeightMm(object),
      z: wall.start.z + uz * clamped + nz * (wall.thicknessMm / 2 + standOffMm + object.dimensions.depthMm / 2),
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

/** Stand-off that puts an object of depthMm flush with the front of a wall-hosted member. */
export function frontFlushStandOffMm(wall: WallEntity, member: InteriorObjectEntity, depthMm: number): number {
  const length = wallLength(wall);
  const nx = -(wall.end.z - wall.start.z) / length;
  const nz = (wall.end.x - wall.start.x) / length;
  const fromCentreline = (member.position.x - wall.start.x) * nx + (member.position.z - wall.start.z) * nz;
  return Math.max(0, fromCentreline + member.dimensions.depthMm / 2 - wall.thicknessMm / 2 - depthMm);
}
