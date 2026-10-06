import {
  DEFAULT_BUILD_RULES,
  resolveCabinetMaterialSpec,
} from "../materialSystem";
import { syncFlatFieldsFromComposition } from "../cabinetComposition";
import {
  supportsDoors,
  supportsDrawers,
  supportsShelves,
  supportsToeKick,
} from "../cabinetCapabilities";
import { applyManufacturingFixes } from "../manufacturingRules";
import { getCabinetDimensionLimits } from "../manufacturingRules/slidingLimits";
import {
  normalizeConstructionSpec,
  shelvesAreAdjustable,
} from "../cabinetConstructionSpec";
import { normalizeCabinetHardware } from "../hardwareSystem";
import { resolveFamilyId } from "../cabinetIdentity/families";
import { isRunFillerCatalogId } from "../cabinetIdentity/catalogBindings";
import type { CabinetConfig } from "./types";
import { cabinetTypePresets, defaultCabinetConfig } from "./defaults";
import { clampedComposition } from "./clampComposition";
import {
  clampCabinetDimensions,
  clampDrawerCount,
  clampShelfCount,
  clampToeKickHeight,
  clampToeKickInset,
  clampWithinRange,
} from "./clampScalars";

/** Run fillers keep their exact size and carry no doors, shelves, drawers or toe kick. */
function clampRunFillerConfig(config: CabinetConfig): CabinetConfig {
  return {
    ...config,
    type: config.type || "base",
    familyId: config.familyId || "frameless-standard-base",
    catalogItemId: config.catalogItemId,
    hasDoors: false,
    shelfCount: 0,
    drawerCount: 0,
    toeKickHeight: 0,
    toeKickInset: 0,
    dimensions: {
      ...config.dimensions,
      width: Math.max(1, config.dimensions.width),
      height: Math.max(1, config.dimensions.height),
      depth: Math.max(1, config.dimensions.depth),
      boardThickness: Math.max(1, config.dimensions.boardThickness || 18),
      backPanelThickness: Math.max(1, config.dimensions.backPanelThickness || 6),
    },
  };
}

export function clampCabinetConfig(config: CabinetConfig): CabinetConfig {
  if (isRunFillerCatalogId(config.catalogItemId)) return clampRunFillerConfig(config);
  const preset = cabinetTypePresets[config.type] ?? defaultCabinetConfig;
  const manufacturing = applyManufacturingFixes({
    ...preset,
    ...config,
    dimensions: {
      ...preset.dimensions,
      ...config.dimensions,
    },
    buildRules: {
      ...(preset.buildRules ?? DEFAULT_BUILD_RULES),
      ...(config.buildRules ?? {}),
    },
  });
  const merged = manufacturing.config;
  merged.dimensions = {
    ...merged.dimensions,
    boardThickness:
      merged.buildRules?.carcassThicknessMm ?? merged.dimensions.boardThickness,
    backPanelThickness:
      merged.buildRules?.backPanelThicknessMm ?? merged.dimensions.backPanelThickness,
  };
  const resolvedMaterialSpec = resolveCabinetMaterialSpec(merged.buildRules);
  const familyLimits = getCabinetDimensionLimits(merged);
  const globallySafeDimensions = clampCabinetDimensions(merged.dimensions);
  // Family ranges are stricter than the global safety limits, except for the
  // 250/300 mm BPO pull-out base carcasses.
  const safeDimensions = {
    ...globallySafeDimensions,
    width: clampWithinRange(
      merged.dimensions.width,
      familyLimits.width.min,
      familyLimits.width.max,
      preset.dimensions.width,
    ),
    height: clampWithinRange(
      merged.dimensions.height,
      familyLimits.height.min,
      familyLimits.height.max,
      preset.dimensions.height,
    ),
    depth: clampWithinRange(
      merged.dimensions.depth,
      familyLimits.depth.min,
      familyLimits.depth.max,
      preset.dimensions.depth,
    ),
  };
  const hasToeKick = supportsToeKick(merged.type);
  const hasShelves = supportsShelves(merged.type);
  const hasDoors = supportsDoors(merged.type);
  const hasDrawers = supportsDrawers(merged.type);

  const shelfCount = hasShelves ? clampShelfCount(merged.shelfCount) : 0;
  const drawerCount = hasDrawers ? clampDrawerCount(merged.drawerCount ?? 0) : 0;
  const hasDoorsFlag = hasDoors ? Boolean(merged.hasDoors) : false;
  const toeKickHeight = hasToeKick ? clampToeKickHeight(merged.toeKickHeight) : 0;
  const toeKickInset = hasToeKick ? clampToeKickInset(merged.toeKickInset) : 0;
  const composition = clampedComposition(merged, {
    safeDimensions, shelfCount, hasDoorsFlag, drawerCount, toeKickHeight, toeKickInset,
  });
  const construction = normalizeConstructionSpec(merged.type, merged.construction, {
    shelvesAdjustable: composition.shelves.adjustable,
  });
  const hardware = normalizeCabinetHardware(merged.type, merged.hardware);
  const syncedComposition = {
    ...composition,
    shelves: {
      ...composition.shelves,
      adjustable: shelvesAreAdjustable(construction.shelfMount),
    },
  };
  const flat = syncFlatFieldsFromComposition(syncedComposition);

  return {
    ...merged,
    familyId: resolveFamilyId(merged.familyId, merged.type),
    catalogItemId: merged.catalogItemId ?? `cabinet:${merged.type}`,
    dimensions: safeDimensions,
    ...flat,
    composition: syncedComposition,
    construction,
    hardware,
    buildRules: {
      ...merged.buildRules,
      carcassThicknessMm: resolvedMaterialSpec.carcassMaterial.thicknessMm,
      backPanelThicknessMm: resolvedMaterialSpec.backMaterial.thicknessMm,
      shelfThicknessMm: resolvedMaterialSpec.shelfMaterial.thicknessMm,
      drawerBoxThicknessMm: resolvedMaterialSpec.drawerBoxMaterial.thicknessMm,
      finishId: resolvedMaterialSpec.doorMaterial.finishId,
      edgeBandingId: resolvedMaterialSpec.carcassMaterial.edgeBandingId,
      grainDirection: resolvedMaterialSpec.carcassMaterial.grainDirection,
      backPanelType: resolvedMaterialSpec.backMaterial.backPanelType,
    },
  };
}

/** Placement grid for a cabinet: run fillers keep 1 mm so they stay flush with cabinet fronts. */
export function cabinetPlacementGridMm(config: Pick<CabinetConfig, "catalogItemId"> | undefined): number | undefined {
  return isRunFillerCatalogId(config?.catalogItemId) ? 1 : undefined;
}
