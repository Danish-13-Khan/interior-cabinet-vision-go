import type { CabinetType } from "../cabinetCapabilities";
import {
  isStorageType,
  supportsDoors,
  supportsDrawers,
  supportsShelves,
  supportsToeKick,
  supportsWallPlacement,
} from "../cabinetCapabilities";
import { getFamilyOpeningRules } from "../cabinetFamilyRules";
import { createDefaultComposition } from "../cabinetComposition";
import type { CabinetConfig, CabinetPlacement } from "../cabinetDimensions";
import {
  BOARD_MATERIALS,
  resolveCabinetMaterialSpec,
  type MaterialPresetId,
} from "../materialSystem";
import type { ManufacturingIssue } from "./types";
import {
  getFamilyDimensionLimits,
  getMaxUnsupportedShelfSpanMm,
  MIN_DRAWER_FRONT_HEIGHT_MM,
  MIN_SHELF_SPACING_MM,
  SINGLE_DOOR_MAX_WIDTH_MM,
  WALL_MOUNT_MAX_Y_MM,
  WALL_MOUNT_MIN_Y_MM,
} from "./limits";

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function maxDrawersForHeight(openingHeightMm: number) {
  return Math.max(1, Math.floor(openingHeightMm / MIN_DRAWER_FRONT_HEIGHT_MM));
}

/**
 * Safe production auto-corrections applied before the normal clamp pipeline.
 * Only adjusts clearly illegal family/material combinations.
 */
export function applyManufacturingFixes(config: CabinetConfig): {
  config: CabinetConfig;
  fixes: ManufacturingIssue[];
} {
  const fixes: ManufacturingIssue[] = [];
  let next: CabinetConfig = {
    ...config,
    dimensions: { ...config.dimensions },
    buildRules: { ...(config.buildRules ?? {}) },
  };

  const limits = getFamilyDimensionLimits(next.type);

  if (isStorageType(next.type)) {
    const before = { ...next.dimensions };
    next.dimensions = {
      ...next.dimensions,
      width: clampNumber(next.dimensions.width, limits.width.min, limits.width.max),
      height: clampNumber(next.dimensions.height, limits.height.min, limits.height.max),
      depth: clampNumber(next.dimensions.depth, limits.depth.min, limits.depth.max),
    };
    if (
      before.width !== next.dimensions.width ||
      before.height !== next.dimensions.height ||
      before.depth !== next.dimensions.depth
    ) {
      fixes.push({
        code: "FAMILY_WIDTH",
        severity: "info",
        autoFixed: true,
        message: `Adjusted ${next.type} size into production limits ${limits.width.min}–${limits.width.max} × ${limits.height.min}–${limits.height.max} × ${limits.depth.min}–${limits.depth.max} mm.`,
      });
    }
  }

  if (!supportsToeKick(next.type) && next.toeKickHeight > 0) {
    next = { ...next, toeKickHeight: 0, toeKickInset: 0 };
    fixes.push({
      code: "TOE_KICK_FORBIDDEN",
      severity: "info",
      autoFixed: true,
      message: `Removed toe kick from ${next.type} cabinet.`,
    });
  }

  if (supportsToeKick(next.type) && getFamilyOpeningRules(next.type).defaultToeKick && next.toeKickHeight <= 0) {
    next = { ...next, toeKickHeight: 100, toeKickInset: next.toeKickInset || 60 };
    fixes.push({
      code: "TOE_KICK_REQUIRED",
      severity: "info",
      autoFixed: true,
      message: "Restored a standard 100 mm toe kick.",
    });
  }

  if (!supportsDoors(next.type) && next.hasDoors) {
    next = { ...next, hasDoors: false };
    fixes.push({
      code: "DRAWER_DOOR_MIX",
      severity: "info",
      autoFixed: true,
      message: `Disabled doors on ${next.type} cabinet.`,
    });
  }

  if (!supportsDrawers(next.type) && (next.drawerCount ?? 0) > 0) {
    next = { ...next, drawerCount: 0 };
    fixes.push({
      code: "DRAWER_DOOR_MIX",
      severity: "info",
      autoFixed: true,
      message: `Cleared drawers from ${next.type} cabinet.`,
    });
  }

  if (supportsDoors(next.type) && next.hasDoors) {
    const style = next.composition?.doors?.style;
    if (style === "double" && next.dimensions.width < SINGLE_DOOR_MAX_WIDTH_MM) {
      next = {
        ...next,
        composition: next.composition
          ? {
              ...next.composition,
              doors: { ...next.composition.doors, style: "single", count: 1 },
            }
          : next.composition,
      };
      fixes.push({
        code: "DOOR_STYLE",
        severity: "info",
        autoFixed: true,
        message: "Switched double doors to single for narrow width.",
      });
    }
  }

  if (supportsShelves(next.type) && next.shelfCount > 0) {
    const openingHeight = Math.max(
      1,
      next.dimensions.height -
        next.dimensions.boardThickness * 2 -
        (supportsToeKick(next.type) ? next.toeKickHeight : 0),
    );
    const maxShelves = Math.max(0, Math.floor(openingHeight / MIN_SHELF_SPACING_MM) - 1);
    if (next.shelfCount > maxShelves) {
      next = { ...next, shelfCount: maxShelves };
      fixes.push({
        code: "SHELF_SPACING",
        severity: "info",
        autoFixed: true,
        message: `Reduced shelf count to ${maxShelves} for workable spacing.`,
      });
    }
  }

  if (supportsDrawers(next.type) && (next.drawerCount ?? 0) > 0) {
    const openingHeight = Math.max(
      1,
      next.dimensions.height -
        next.dimensions.boardThickness * 2 -
        (supportsToeKick(next.type) ? next.toeKickHeight : 0),
    );
    const maxDrawers = maxDrawersForHeight(openingHeight);
    if ((next.drawerCount ?? 0) > maxDrawers) {
      next = { ...next, drawerCount: maxDrawers };
      fixes.push({
        code: "DRAWER_HEIGHT",
        severity: "info",
        autoFixed: true,
        message: `Reduced drawer count to ${maxDrawers} for workable front heights.`,
      });
    }
  }

  if (next.type === "sink") {
    const materialSpec = resolveCabinetMaterialSpec(next.buildRules);
    const carcass = BOARD_MATERIALS.find(
      (material) => material.id === materialSpec.carcassMaterial.boardMaterialId,
    );
    if (carcass && !carcass.moistureResistant) {
      const wetPreset: MaterialPresetId = "ply-premium";
      next = {
        ...next,
        buildRules: {
          ...next.buildRules,
          materialPresetId: wetPreset,
        },
      };
      fixes.push({
        code: "MATERIAL_WET_ZONE",
        severity: "info",
        autoFixed: true,
        message: "Switched sink cabinet material preset to moisture-resistant plywood.",
      });
    }
  }

  // Shelf span: auto-add dividers when span clearly exceeds material limit.
  if (supportsShelves(next.type) && next.shelfCount > 0 && next.type !== "corner") {
    const needed = getMinDividersForShelfSpan(next);
    const dividerCount = next.composition?.dividers?.count ?? 0;
    if (needed > dividerCount) {
      const baseComposition =
        next.composition ?? createDefaultComposition(next.type, next);
      next = {
        ...next,
        composition: {
          ...baseComposition,
          dividers: {
            ...baseComposition.dividers,
            count: needed,
          },
        },
      };
      fixes.push({
        code: "SHELF_SPAN",
        severity: "info",
        autoFixed: true,
        message: "Added a center divider to bring shelf span within material limits.",
      });
    }
  }

  return { config: next, fixes };
}

export function applyWallMountPlacementFix(
  type: CabinetType,
  placement: CabinetPlacement,
): { placement: CabinetPlacement; fixes: ManufacturingIssue[] } {
  const fixes: ManufacturingIssue[] = [];
  let next = { ...placement };

  if (supportsWallPlacement(type) && next.attachment === "floor") {
    next = {
      ...next,
      attachment: "back-wall",
      y: next.y > 0 ? next.y : type === "mirror" ? 300 : 1400,
    };
    fixes.push({
      code: "WALL_ATTACHMENT",
      severity: "info",
      autoFixed: true,
      message: `Set ${type} attachment to back-wall mounting.`,
    });
  }

  if (supportsWallPlacement(type)) {
    const clampedY = clampNumber(next.y, WALL_MOUNT_MIN_Y_MM, WALL_MOUNT_MAX_Y_MM);
    if (clampedY !== next.y) {
      next = { ...next, y: clampedY };
      fixes.push({
        code: "WALL_MOUNT_HEIGHT",
        severity: "info",
        autoFixed: true,
        message: `Adjusted wall-mount height into ${WALL_MOUNT_MIN_Y_MM}–${WALL_MOUNT_MAX_Y_MM} mm.`,
      });
    }
  }

  return { placement: next, fixes };
}

export function getMinDividersForShelfSpan(config: CabinetConfig): number {
  const current = config.composition?.dividers?.count ?? 0;
  if (!supportsShelves(config.type) || config.shelfCount <= 0 || config.type === "corner") {
    return current;
  }
  const materialSpec = resolveCabinetMaterialSpec(config.buildRules);
  const openingWidth = Math.max(
    0,
    config.dimensions.width - config.dimensions.boardThickness * 2,
  );
  const maxSpan = getMaxUnsupportedShelfSpanMm(
    materialSpec.shelfMaterial.thicknessMm,
    materialSpec.shelfMaterial.boardMaterialId,
  );
  if (maxSpan <= 0 || openingWidth <= maxSpan) {
    return current;
  }
  const needed = Math.ceil(openingWidth / maxSpan) - 1;
  return Math.max(current, needed);
}
