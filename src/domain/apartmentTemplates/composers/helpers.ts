import {
  orientWallForRoom,
  type InteriorObjectEntity,
  type InteriorProject,
  type WallEntity,
} from "../../interiorProject";
import { createLivingRoomObject, type LivingRoomCatalogId } from "../../livingRoom/catalog";
import type { LivingRoomIdFactory } from "../../livingRoom/ids";
import { attached, placementAt } from "../../livingRoom/wallSegmentPlacement";
import type { WallSide } from "../types";
import { fixedAlongToRoomAlongMm, longestFreePieceOnSide } from "./wallPieces";

export {
  fixedAlongToRoomAlongMm,
  freePiecesOnSide,
  longestFreePieceOnSide,
  type FreeWallPiece,
} from "./wallPieces";
export { objectOverlapsOpeningOnWall, roomObjectsOverlapOpenings } from "./openingOverlap";

export function withActiveRoom(
  project: InteriorProject,
  roomId: string,
): InteriorProject {
  return project.activeRoomId === roomId ? project : { ...project, activeRoomId: roomId };
}

export function placeCabinetOnWall(
  project: InteriorProject,
  object: InteriorObjectEntity,
  wall: WallEntity,
  alongMm: number,
): InteriorProject {
  const stored = project.walls.find((item) => item.id === wall.id) ?? wall;
  const roomWall = orientWallForRoom(project, object.roomId, stored);
  const width = object.dimensions.widthMm;
  const roomAlong = fixedAlongToRoomAlongMm(
    project, object.roomId, wall, alongMm - width / 2, width,
  ) + width / 2;
  const placed = attached(object, placementAt(roomWall, object, roomAlong));
  const others = project.objects.filter((item) => item.id !== object.id);
  return { ...project, objects: [...others, placed] };
}

export function placeCatalogOnWall(
  project: InteriorProject,
  roomId: string,
  side: WallSide,
  catalogItemId: LivingRoomCatalogId,
  objectKey: string,
  idFactory: LivingRoomIdFactory,
  alongRatio = 0.5,
): InteriorProject {
  const draft = createLivingRoomObject(catalogItemId, {
    id: idFactory("object", objectKey),
    roomId,
    position: { x: 0, y: 0, z: 0 },
  });
  // Must fit a free piece (no doors / windows / arches / other hosted objects); else skip.
  const piece = longestFreePieceOnSide(project, roomId, side, draft.dimensions.widthMm);
  if (!piece) return project;
  const usable = Math.max(0, piece.lengthMm - draft.dimensions.widthMm);
  const alongMm = piece.startAlongMm + usable * alongRatio + draft.dimensions.widthMm / 2;
  return placeCabinetOnWall(project, draft, piece.wall, alongMm);
}

export function placeCatalogInRoom(
  project: InteriorProject,
  roomId: string,
  catalogItemId: LivingRoomCatalogId,
  objectKey: string,
  idFactory: LivingRoomIdFactory,
  offset: { x: number; z: number; y?: number; rotationY?: number },
  bounds: { centerX: number; centerZ: number },
): InteriorProject {
  const object = createLivingRoomObject(catalogItemId, {
    id: idFactory("object", objectKey),
    roomId,
    position: {
      x: bounds.centerX + offset.x,
      y: offset.y ?? 0,
      z: bounds.centerZ + offset.z,
    },
    rotationY: offset.rotationY,
  });
  return { ...project, objects: [...project.objects, object] };
}

/** Plan offset / facing relative to a declared wall side (inward from that wall). */
export function offsetTowardSide(
  side: WallSide,
  bounds: { widthMm: number; depthMm: number },
  inwardRatio: number,
): { x: number; z: number; rotationY: number } {
  const xSpan = bounds.widthMm * inwardRatio;
  const zSpan = bounds.depthMm * inwardRatio;
  if (side === "north") return { x: 0, z: -zSpan, rotationY: 180 };
  if (side === "south") return { x: 0, z: zSpan, rotationY: 0 };
  if (side === "west") return { x: -xSpan, z: 0, rotationY: 90 };
  return { x: xSpan, z: 0, rotationY: 270 };
}

export function oppositeSide(side: WallSide): WallSide {
  if (side === "north") return "south";
  if (side === "south") return "north";
  if (side === "west") return "east";
  return "west";
}
