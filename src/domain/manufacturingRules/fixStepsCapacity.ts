import { supportsDrawers, supportsShelves, supportsToeKick } from "../cabinetCapabilities";
import { createDefaultComposition } from "../cabinetComposition";
import {
  BOARD_MATERIALS,
  resolveCabinetMaterialSpec,
  type MaterialPresetId,
} from "../materialSystem";
import type { FixStep } from "./fixSteps";
import { MIN_DRAWER_FRONT_HEIGHT_MM, MIN_SHELF_SPACING_MM } from "./limits";
import { getMinDividersForShelfSpan } from "./shelfSpan";

function maxDrawersForHeight(openingHeightMm: number) {
  return Math.max(1, Math.floor(openingHeightMm / MIN_DRAWER_FRONT_HEIGHT_MM));
}

/** Shelf and drawer counts reduced to workable spacing / front heights. */
export const fixShelfAndDrawerCounts: FixStep = (config, fixes) => {
  let next = config;
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
  return next;
};

/** Sink carcasses switch to a moisture-resistant preset. */
export const fixWetZoneMaterial: FixStep = (config, fixes) => {
  let next = config;
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
  return next;
};

/** Shelf span: auto-add dividers when span clearly exceeds material limit. */
export const fixShelfSpan: FixStep = (config, fixes) => {
  let next = config;
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
  return next;
};
