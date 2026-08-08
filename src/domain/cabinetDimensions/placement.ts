import type { CabinetType } from "../cabinetCapabilities";
import type {
  CabinetDimensions,
  CabinetInstance,
  CabinetPlacement,
  CabinetProject,
  RoomBounds,
} from "./types";
import {
  CABINET_CLEARANCE_MM,
  CABINET_GRID_SNAP_MM,
  ROOM_DEPTH_MM,
  ROOM_HEIGHT_MM,
  ROOM_WIDTH_MM,
} from "./defaults";

export function millimetresToMetres(valueInMillimetres: number): number {
  return valueInMillimetres / 1000;
}

export function normalizeRotationAngle(value: number): 0 | 90 | 180 | 270 {
  const normalized = ((Math.round(value / 90) * 90) % 360 + 360) % 360;

  if (normalized === 90 || normalized === 180 || normalized === 270) {
    return normalized;
  }

  return 0;
}

export function usesRotatedFootprint(rotation: number): boolean {
  const safeRotation = normalizeRotationAngle(rotation);
  return safeRotation === 90 || safeRotation === 270;
}

export function getFootprintDimensions(
  dimensions: CabinetDimensions,
  rotation: number,
): { width: number; depth: number } {
  return usesRotatedFootprint(rotation)
    ? { width: dimensions.depth, depth: dimensions.width }
    : { width: dimensions.width, depth: dimensions.depth };
}

export function getDefaultBottomOffsetMm(type: CabinetType): number {
  switch (type) {
    case "wall":
      return 1400;
    case "mirror":
      return 300;
    default:
      return 0;
  }
}

export function snapMillimetresToGrid(
  value: number,
  gridSize: number = CABINET_GRID_SNAP_MM,
): number {
  return Math.round(value / gridSize) * gridSize;
}

function getCabinetFootprint(
  cabinet: Pick<CabinetInstance, "placement" | "config">,
  dimensions: CabinetDimensions = cabinet.config.dimensions,
) {
  const footprint = getFootprintDimensions(dimensions, cabinet.placement.rotation);

  return {
    minX: cabinet.placement.x - footprint.width / 2,
    maxX: cabinet.placement.x + footprint.width / 2,
    minZ: cabinet.placement.z - footprint.depth / 2,
    maxZ: cabinet.placement.z + footprint.depth / 2,
  };
}

export function clampCabinetPlacement(
  placement: CabinetPlacement,
  dimensions: CabinetDimensions,
  roomBounds: RoomBounds = {
    widthMm: ROOM_WIDTH_MM,
    depthMm: ROOM_DEPTH_MM,
    heightMm: ROOM_HEIGHT_MM,
  },
): CabinetPlacement {
  const rotation = normalizeRotationAngle(placement.rotation);
  const footprint = getFootprintDimensions(dimensions, rotation);
  const halfWidth = footprint.width / 2;
  const halfDepth = footprint.depth / 2;
  const attachment = placement.attachment;
  const roomWidth = roomBounds.widthMm;
  const roomDepth = roomBounds.depthMm;
  const roomHeight = roomBounds.heightMm;

  const clampedY = Math.min(
    Math.max(Number.isFinite(placement.y) ? placement.y : 0, 0),
    roomHeight - dimensions.height,
  );

  const basePlacement: CabinetPlacement = {
    x: snapMillimetresToGrid(Number.isFinite(placement.x) ? placement.x : 0),
    y: snapMillimetresToGrid(clampedY),
    z: snapMillimetresToGrid(Number.isFinite(placement.z) ? placement.z : 0),
    rotation,
    attachment,
  };

  if (attachment === "back-wall") {
    return {
      ...basePlacement,
      x: Math.min(Math.max(basePlacement.x, -roomWidth / 2 + halfWidth), roomWidth / 2 - halfWidth),
      z: -roomDepth / 2 + halfDepth,
      rotation: 0,
    };
  }

  if (attachment === "left-wall") {
    return {
      ...basePlacement,
      x: -roomWidth / 2 + halfDepth,
      z: Math.min(Math.max(basePlacement.z, -roomDepth / 2 + halfWidth), roomDepth / 2 - halfWidth),
      rotation: 90,
    };
  }

  if (attachment === "right-wall") {
    return {
      ...basePlacement,
      x: roomWidth / 2 - halfDepth,
      z: Math.min(Math.max(basePlacement.z, -roomDepth / 2 + halfWidth), roomDepth / 2 - halfWidth),
      rotation: 270,
    };
  }

  return {
    ...basePlacement,
    y: 0,
    x: Math.min(Math.max(basePlacement.x, -roomWidth / 2 + halfWidth), roomWidth / 2 - halfWidth),
    z: Math.min(Math.max(basePlacement.z, -roomDepth / 2 + halfDepth), roomDepth / 2 - halfDepth),
  };
}

export function getWallPlacement(
  currentPlacement: CabinetPlacement,
  type: CabinetType,
  dimensions: CabinetDimensions,
  attachment: CabinetPlacement["attachment"],
  roomBounds?: RoomBounds,
): CabinetPlacement {
  return clampCabinetPlacement(
    {
      ...currentPlacement,
      attachment,
      y: attachment === "floor" ? 0 : currentPlacement.y || getDefaultBottomOffsetMm(type),
      rotation:
        attachment === "back-wall"
          ? 0
          : attachment === "left-wall"
            ? 90
            : attachment === "right-wall"
              ? 270
              : currentPlacement.rotation,
    },
    dimensions,
    roomBounds,
  );
}

export function cabinetsOverlap(
  first: Pick<CabinetInstance, "placement" | "config">,
  second: Pick<CabinetInstance, "placement" | "config">,
  clearanceMm: number = CABINET_CLEARANCE_MM,
  firstDimensions: CabinetDimensions = first.config.dimensions,
  secondDimensions: CabinetDimensions = second.config.dimensions,
): boolean {
  const a = getCabinetFootprint(first, firstDimensions);
  const b = getCabinetFootprint(second, secondDimensions);

  return !(
    a.maxX + clearanceMm <= b.minX ||
    b.maxX + clearanceMm <= a.minX ||
    a.maxZ + clearanceMm <= b.minZ ||
    b.maxZ + clearanceMm <= a.minZ
  );
}

export function projectHasCollision(
  project: CabinetProject,
  cabinetId: string,
  nextPlacement: CabinetPlacement,
  nextDimensions?: CabinetDimensions,
): boolean {
  const activeCabinet = project.cabinets.find((cabinet) => cabinet.id === cabinetId);

  if (!activeCabinet) {
    return false;
  }

  const candidateCabinet = {
    ...activeCabinet,
    placement: nextPlacement,
    config: {
      ...activeCabinet.config,
      dimensions: nextDimensions ?? activeCabinet.config.dimensions,
    },
  };

  return project.cabinets.some((cabinet) => {
    if (cabinet.id === cabinetId) {
      return false;
    }

    const candidateTop = candidateCabinet.placement.y + candidateCabinet.config.dimensions.height;
    const candidateBottom = candidateCabinet.placement.y;
    const otherTop = cabinet.placement.y + cabinet.config.dimensions.height;
    const otherBottom = cabinet.placement.y;

    if (
      candidateTop + CABINET_CLEARANCE_MM <= otherBottom ||
      otherTop + CABINET_CLEARANCE_MM <= candidateBottom
    ) {
      return false;
    }

    return cabinetsOverlap(candidateCabinet, cabinet);
  });
}
