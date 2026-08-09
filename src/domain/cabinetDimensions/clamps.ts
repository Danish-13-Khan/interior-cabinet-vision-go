import {
  DEFAULT_BUILD_RULES,
  resolveCabinetMaterialSpec,
} from "../materialSystem";
import {
  createDefaultComposition,
  resolveCabinetComposition,
  syncFlatFieldsFromComposition,
} from "../cabinetComposition";
import {
  supportsDoors,
  supportsDrawers,
  supportsShelves,
  supportsToeKick,
} from "../cabinetCapabilities";
import { clampCostingSettings } from "../costingSettings";
import { clampProjectStandards } from "../projectStandards";
import { clampJobMeta } from "../jobMeta";
import {
  applyManufacturingFixes,
  getMinDividersForShelfSpan,
  applyWallMountPlacementFix,
} from "../manufacturingRules";
import {
  clampDraftingDisplay,
  clampProjectDrafting,
} from "../draftingAnnotations";
import { clampProjectSheetSet } from "../sheetDocuments";
import {
  normalizeConstructionSpec,
  shelvesAreAdjustable,
} from "../cabinetConstructionSpec";
import {
  clampQuoteHistory,
  clampQuoteSettings,
} from "../quoteSettings";
import {
  clampReviewNotes,
  clampRevisionHistory,
} from "../projectReview/clamp";
import { clampSheetOptimizerSettings } from "../sheetStock";
import { normalizeCabinetHardware } from "../hardwareSystem";
import type {
  CabinetConfig,
  CabinetDimensions,
  CabinetPlacement,
  CabinetProject,
} from "./types";
import {
  CABINET_DEPTH_MAX_MM,
  CABINET_DEPTH_MIN_MM,
  CABINET_DRAWER_MAX,
  CABINET_DRAWER_MIN,
  CABINET_GRID_SNAP_MM,
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
  defaultCabinetProject,
} from "./defaults";
import {
  clampCabinetPlacement,
  getDefaultBottomOffsetMm,
  normalizeRotationAngle,
  snapMillimetresToGrid,
} from "./placement";

function clampWithinRange(
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

export function clampCabinetConfig(config: CabinetConfig): CabinetConfig {
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
  const safeDimensions = clampCabinetDimensions(merged.dimensions);
  const hasToeKick = supportsToeKick(merged.type);
  const hasShelves = supportsShelves(merged.type);
  const hasDoors = supportsDoors(merged.type);
  const hasDrawers = supportsDrawers(merged.type);

  const shelfCount = hasShelves ? clampShelfCount(merged.shelfCount) : 0;
  const drawerCount = hasDrawers ? clampDrawerCount(merged.drawerCount ?? 0) : 0;
  const hasDoorsFlag = hasDoors ? Boolean(merged.hasDoors) : false;
  const toeKickHeight = hasToeKick ? clampToeKickHeight(merged.toeKickHeight) : 0;
  const toeKickInset = hasToeKick ? clampToeKickInset(merged.toeKickInset) : 0;
  const seedComposition =
    merged.composition ??
    createDefaultComposition(merged.type, {
      ...merged,
      dimensions: safeDimensions,
      shelfCount,
      hasDoors: hasDoorsFlag,
      drawerCount,
      toeKickHeight,
      toeKickInset,
      leftEndPanel: Boolean(merged.leftEndPanel),
      rightEndPanel: Boolean(merged.rightEndPanel),
    });

  const composition = resolveCabinetComposition({
    ...merged,
    dimensions: safeDimensions,
    shelfCount,
    hasDoors: hasDoorsFlag,
    drawerCount,
    toeKickHeight,
    toeKickInset,
    leftEndPanel: Boolean(merged.leftEndPanel),
    rightEndPanel: Boolean(merged.rightEndPanel),
    composition: {
      ...seedComposition,
      shelves: {
        ...seedComposition.shelves,
        count: shelfCount,
      },
      drawers: {
        ...seedComposition.drawers,
        count: drawerCount,
      },
      doors: {
        ...seedComposition.doors,
        enabled: hasDoorsFlag,
        style: hasDoorsFlag
          ? seedComposition.doors.style === "none"
            ? safeDimensions.width < 600
              ? "single"
              : "double"
            : seedComposition.doors.style
          : "none",
      },
      toeKick: {
        ...seedComposition.toeKick,
        enabled: toeKickHeight > 0,
        heightMm: toeKickHeight,
        insetMm: toeKickInset,
      },
      endPanels: {
        left: Boolean(merged.leftEndPanel),
        right: Boolean(merged.rightEndPanel),
      },
      dividers: {
        ...seedComposition.dividers,
        count: Math.max(
          seedComposition.dividers.count,
          merged.composition?.dividers?.count ?? 0,
          getMinDividersForShelfSpan({
            ...merged,
            dimensions: safeDimensions,
            shelfCount,
            composition: seedComposition,
          }),
        ),
      },
    },
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

export function clampCabinetProject(project: CabinetProject): CabinetProject {
  const layers = Array.isArray(project.layers) && project.layers.length > 0
    ? project.layers.map((layer, index) => ({
        id: layer.id || `layer-${index + 1}`,
        name: layer.name?.trim() || `Layer ${index + 1}`,
        visible: layer.visible !== false,
        locked: Boolean(layer.locked),
      }))
    : [...(defaultCabinetProject.layers ?? [])];
  const groups = Array.isArray(project.groups)
    ? project.groups.map((group, index) => ({
        id: group.id || `group-${index + 1}`,
        name: group.name?.trim() || `Group ${index + 1}`,
      }))
    : [];
  const validLayerIds = new Set(layers.map((layer) => layer.id));
  const validGroupIds = new Set(groups.map((group) => group.id));
  const defaultLayerId = layers[0]?.id ?? "layer-default";

  return {
    version: 1,
    cabinets: project.cabinets.map((cabinet, index) => ({
      ...cabinet,
      id: cabinet.id || `cabinet-${index + 1}`,
      name: cabinet.name || `Cabinet ${index + 1}`,
      layerId:
        cabinet.layerId && validLayerIds.has(cabinet.layerId)
          ? cabinet.layerId
          : defaultLayerId,
      groupId:
        cabinet.groupId && validGroupIds.has(cabinet.groupId)
          ? cabinet.groupId
          : null,
      config: clampCabinetConfig(cabinet.config),
      placement: (() => {
        const type = cabinet.config?.type ?? "base";
        const rawPlacement = {
          x: Number.isFinite(cabinet.placement?.x) ? cabinet.placement.x : index * 1200,
          y: Number.isFinite(cabinet.placement?.y)
            ? cabinet.placement.y
            : getDefaultBottomOffsetMm(type),
          z: Number.isFinite(cabinet.placement?.z) ? cabinet.placement.z : 0,
          rotation: normalizeRotationAngle(cabinet.placement?.rotation ?? 0),
          attachment:
            cabinet.placement?.attachment === "back-wall" ||
            cabinet.placement?.attachment === "left-wall" ||
            cabinet.placement?.attachment === "right-wall"
              ? cabinet.placement.attachment
              : "floor",
        } as CabinetPlacement;
        const mounted = applyWallMountPlacementFix(type, rawPlacement).placement;
        return clampCabinetPlacement(
          mounted,
          clampCabinetConfig(cabinet.config).dimensions,
        );
      })(),
    })),
    layers,
    groups,
    preferences: {
      snapSizeMm:
        project.preferences?.snapSizeMm && Number.isFinite(project.preferences.snapSizeMm)
          ? Math.max(10, Math.min(500, snapMillimetresToGrid(project.preferences.snapSizeMm, 10)))
          : defaultCabinetProject.preferences?.snapSizeMm ?? CABINET_GRID_SNAP_MM,
      showGrid: project.preferences?.showGrid !== false,
      autoSaveToBrowser: project.preferences?.autoSaveToBrowser !== false,
      costing: clampCostingSettings(
        project.preferences?.costing ?? defaultCabinetProject.preferences?.costing,
      ),
      quote: clampQuoteSettings(
        project.preferences?.quote ?? defaultCabinetProject.preferences?.quote,
      ),
      sheetOptimizer: clampSheetOptimizerSettings(
        project.preferences?.sheetOptimizer ??
          defaultCabinetProject.preferences?.sheetOptimizer,
      ),
      standards: clampProjectStandards(
        project.preferences?.standards ?? defaultCabinetProject.preferences?.standards,
      ),
      drafting: clampDraftingDisplay(
        project.preferences?.drafting ?? defaultCabinetProject.preferences?.drafting,
      ),
    },
    drafting: clampProjectDrafting(project.drafting ?? defaultCabinetProject.drafting),
    quoteHistory: clampQuoteHistory(project.quoteHistory ?? defaultCabinetProject.quoteHistory),
    reviewNotes: clampReviewNotes(project.reviewNotes ?? defaultCabinetProject.reviewNotes),
    revisionHistory: clampRevisionHistory(
      project.revisionHistory ?? defaultCabinetProject.revisionHistory,
    ),
    job: clampJobMeta(project.job ?? defaultCabinetProject.job),
    sheetSet: clampProjectSheetSet(
      project.sheetSet,
      project.sheetSet?.activeSheetId ?? "plan",
    ),
  };
}
