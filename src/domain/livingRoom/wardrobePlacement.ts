import type { InteriorObjectEntity, InteriorProject } from "../interiorProject";
import { orientWallForRoom, selectRoomWalls } from "../interiorProject";
import { isWallCabinetObject } from "./cabinetSceneMount";
import type { PlanSnapResult } from "./planSnapEngine";
import { attached, placementAt, wallLength, type WallPlacement } from "./wallSegmentPlacement";
import { snapSpanAlongWall, spanSnapMarker, wallOffsetCandidates } from "./wallOffsetSnap";

/** Default along-wall pick radius for a commit, where no pointer radius is known. */
export const CABINET_ALONG_WALL_SNAP_MM = 40;

export type { WallPlacement } from "./wallSegmentPlacement";
export {
  arrangeCabinetRun,
  cabinetRunForObject,
  cabinetRunLengthMm,
  updateCabinetRun,
  type CabinetRunAlignment,
  type CabinetRunMetadata,
  type CabinetRunOptions,
} from "./cabinetRunLayout";
export {
  cabinetRunFillerForObject,
  countCabinetRunFillers,
  isCabinetRunFiller,
  reconcileCabinetRunsAfterObjectRemoval,
  reflowCabinetRunsForWalls,
  syncCabinetRunFillers,
  updateCabinetRunLayout,
  type CabinetRunFillerMetadata,
  type CabinetRunLayoutOptions,
} from "./cabinetRunFillers";
export {
  listRoomWallCorners,
  placeCornerCabinet,
  preferredRoomWallCorner,
  reflowCornerCabinetsForWalls,
  type RoomWallCorner,
} from "./cornerPlacement";

/** Resolves a cabinet against the room-facing side of a rectangular wall. */
export function placeOnWall(
  project: InteriorProject,
  object: InteriorObjectEntity,
  wallId: string,
): WallPlacement | null {
  const storedWall = selectRoomWalls(project, object.roomId).find((item) => item.id === wallId);
  if (!storedWall) return null;
  const wall = orientWallForRoom(project, object.roomId, storedWall);
  const length = wallLength(wall);
  if (length < object.dimensions.widthMm) return null;
  const ux = (wall.end.x - wall.start.x) / length;
  const uz = (wall.end.z - wall.start.z) / length;
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

/**
 * Snap a cabinet to the nearest room wall. Along the wall its centre snaps to the
 * wall midpoint and its edges to opening and neighbour-cabinet edges within
 * `thresholdMm` (Phase 4); `snap` carries the winning target for the marker.
 */
export function snapCabinetToWallWithSnap(
  project: InteriorProject,
  object: InteriorObjectEntity,
  desired: { x: number; y: number; z: number },
  options: { thresholdMm?: number } = {},
): { object: InteriorObjectEntity; snap: PlanSnapResult | null } {
  if (object.kind !== "cabinet") return { object: { ...object, position: desired }, snap: null };
  const nearest = selectRoomWalls(project, object.roomId)
    .filter((wall) => wallLength(wall) >= object.dimensions.widthMm)
    .map((storedWall) => {
      const wall = orientWallForRoom(project, object.roomId, storedWall);
      const length = wallLength(wall);
      const ux = (wall.end.x - wall.start.x) / length;
      const uz = (wall.end.z - wall.start.z) / length;
      const offset = (desired.x - wall.start.x) * ux + (desired.z - wall.start.z) * uz;
      const px = wall.start.x + ux * offset;
      const pz = wall.start.z + uz * offset;
      return { wall, offset, distance: Math.hypot(desired.x - px, desired.z - pz) };
    })
    .sort((a, b) => a.distance - b.distance)[0];
  if (!nearest || nearest.distance > object.dimensions.depthMm + 350) return { object: { ...object, position: desired }, snap: null };
  const along = snapSpanAlongWall({
    centreMm: nearest.offset,
    widthMm: object.dimensions.widthMm,
    lengthMm: wallLength(nearest.wall),
    candidates: wallOffsetCandidates(project, nearest.wall, { excludeObjectId: object.id }),
    thresholdMm: options.thresholdMm ?? CABINET_ALONG_WALL_SNAP_MM,
    gridMm: 0,
  });
  const placement = placementAt(nearest.wall, object, along.centreMm);
  const y = Math.min(
    Math.max(0, nearest.wall.heightMm - object.dimensions.heightMm),
    Math.max(0, desired.y),
  );
  const snapped = attached(object, {
    ...placement,
    position: { ...placement.position, y },
  });
  const result = isWallCabinetObject(snapped)
    ? { ...snapped, parameters: { ...snapped.parameters, mountHeightMm: y } }
    : snapped;
  return { object: result, snap: spanSnapMarker(nearest.wall, along) };
}

export function snapCabinetToWall(
  project: InteriorProject,
  object: InteriorObjectEntity,
  desired: { x: number; y: number; z: number },
  options: { thresholdMm?: number } = {},
) {
  return snapCabinetToWallWithSnap(project, object, desired, options).object;
}
