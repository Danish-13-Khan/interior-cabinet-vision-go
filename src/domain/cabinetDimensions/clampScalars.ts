import type { CabinetDimensions } from "./types";
import {
  CABINET_DEPTH_MAX_MM,
  CABINET_DEPTH_MIN_MM,
  CABINET_DRAWER_MAX,
  CABINET_DRAWER_MIN,
  CABINET_HEIGHT_MAX_MM,
  CABINET_HEIGHT_MIN_MM,
  CABINET_SHELF_MAX,
  CABINET_SHELF_MIN,
  CABINET_TOE_KICK_HEIGHT_MAX_MM,
  CABINET_TOE_KICK_HEIGHT_MIN_MM,
  CABINET_TOE_KICK_INSET_MAX_MM,
  CABINET_TOE_KICK_INSET_MIN_MM,
  CABINET_WIDTH_MAX_MM,
  CABINET_WIDTH_MIN_MM,
  cabinetTypePresets,
  defaultCabinetConfig,
} from "./defaults";

/** Clamp into [min, max]; non-finite values fall back. */
export function clampWithinRange(
  value: number,
  min: number,
  max: number,
  fallback: number,
): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, value));
}

export function clampCabinetWidth(width: number): number {
  return clampWithinRange(
    width,
    CABINET_WIDTH_MIN_MM,
    CABINET_WIDTH_MAX_MM,
    defaultCabinetConfig.dimensions.width,
  );
}

export function clampCabinetHeight(height: number): number {
  return clampWithinRange(
    height,
    CABINET_HEIGHT_MIN_MM,
    CABINET_HEIGHT_MAX_MM,
    defaultCabinetConfig.dimensions.height,
  );
}

export function clampCabinetDepth(depth: number): number {
  return clampWithinRange(
    depth,
    CABINET_DEPTH_MIN_MM,
    CABINET_DEPTH_MAX_MM,
    defaultCabinetConfig.dimensions.depth,
  );
}

export function clampShelfCount(shelfCount: number): number {
  return Math.round(
    clampWithinRange(
      shelfCount,
      CABINET_SHELF_MIN,
      CABINET_SHELF_MAX,
      defaultCabinetConfig.shelfCount,
    ),
  );
}

export function clampDrawerCount(drawerCount: number): number {
  return Math.round(
    clampWithinRange(
      drawerCount,
      CABINET_DRAWER_MIN,
      CABINET_DRAWER_MAX,
      0,
    ),
  );
}

export function clampToeKickHeight(toeKickHeight: number): number {
  return clampWithinRange(
    toeKickHeight,
    CABINET_TOE_KICK_HEIGHT_MIN_MM,
    CABINET_TOE_KICK_HEIGHT_MAX_MM,
    cabinetTypePresets.base.toeKickHeight,
  );
}

export function clampToeKickInset(toeKickInset: number): number {
  return clampWithinRange(
    toeKickInset,
    CABINET_TOE_KICK_INSET_MIN_MM,
    CABINET_TOE_KICK_INSET_MAX_MM,
    cabinetTypePresets.base.toeKickInset,
  );
}

export function clampCabinetDimensions(
  dimensions: CabinetDimensions,
): CabinetDimensions {
  return {
    ...dimensions,
    width: clampCabinetWidth(dimensions.width),
    height: clampCabinetHeight(dimensions.height),
    depth: clampCabinetDepth(dimensions.depth),
    boardThickness: Math.max(1, dimensions.boardThickness),
    backPanelThickness: Math.max(1, dimensions.backPanelThickness),
  };
}
