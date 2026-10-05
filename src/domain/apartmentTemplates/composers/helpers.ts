import {
  orientWallForRoom,
  selectRoomOpenings,
  type InteriorObjectEntity,
  type InteriorProject,
} from "../../interiorProject";
import { createLivingRoomObject, type LivingRoomCatalogId } from "../../livingRoom/catalog";
import type { LivingRoomIdFactory } from "../../livingRoom/ids";
import {
  openingSpanOnOrientedWall,
} from "../../livingRoom/cabinetRunPlacementPreview";
import { attached, placementAt, wallLength } from "../../livingRoom/wallSegmentPlacement";
import { wallOnSide } from "../wallSide";
import type { WallSide } from "../types";

export function withActiveRoom(
  project: InteriorProject,
  roomId: string,
): InteriorProject {
  return project.activeRoomId === roomId ? project : { ...project, activeRoomId: roomId };
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
  const stored = wallOnSide(project, roomId, side);
  if (!stored) return project;
  const wall = orientWallForRoom(project, roomId, stored);
  const length = wallLength(wall);
  const draft = createLivingRoomObject(catalogItemId, {
    id: idFactory("object", objectKey),
    roomId,
    position: { x: 0, y: 0, z: 0 },
  });
  const alongMm = length * alongRatio;
  const placed = attached(draft, placementAt(wall, draft, alongMm));
  return { ...project, objects: [...project.objects, placed] };
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

/** True when a wall-hosted object span overlaps a door/window on the same wall. */
export function objectOverlapsOpeningOnWall(
  project: InteriorProject,
  object: InteriorObjectEntity,
): boolean {
  const wallId = (object.extensions?.wallAttachment as { wallId?: string } | undefined)?.wallId;
  if (!wallId) return false;
  const stored = project.walls.find((wall) => wall.id === wallId);
  if (!stored) return false;
  const wall = orientWallForRoom(project, object.roomId, stored);
  const length = wallLength(wall);
  const ux = (wall.end.x - wall.start.x) / length;
  const uz = (wall.end.z - wall.start.z) / length;
  const center =
    (object.position.x - wall.start.x) * ux + (object.position.z - wall.start.z) * uz;
  const half = object.dimensions.widthMm / 2;
  const start = center - half;
  const end = center + half;
  for (const opening of selectRoomOpenings(project, object.roomId)) {
    if (opening.wallId !== wallId) continue;
    if (opening.kind !== "door" && opening.kind !== "window") continue;
    const span = openingSpanOnOrientedWall(opening, stored, wall, length);
    if (start < span.endMm && end > span.startMm) return true;
  }
  return false;
}

export function roomObjectsOverlapOpenings(
  project: InteriorProject,
  roomId: string,
): InteriorObjectEntity[] {
  return project.objects.filter(
    (object) => object.roomId === roomId && objectOverlapsOpeningOnWall(project, object),
  );
}
