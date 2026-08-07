import {
  DEFAULT_BUILD_RULES,
  resolveCabinetMaterialSpec,
  type CabinetBuildRules,
} from "./materialSystem";
import {
  createDefaultComposition,
  resolveCabinetComposition,
  syncFlatFieldsFromComposition,
  type CabinetComposition,
} from "./cabinetComposition";
import type { CabinetType } from "./cabinetCapabilities";
import type { CostingSettings } from "./costingSettings";
import {
  clampCostingSettings,
  DEFAULT_COSTING_SETTINGS,
} from "./costingSettings";
import type { ProjectStandards } from "./projectStandards";
import {
  clampProjectStandards,
  DEFAULT_PROJECT_STANDARDS,
} from "./projectStandards";
import type { ProjectJobMeta } from "./jobMeta";
import { clampJobMeta, createDefaultJobMeta } from "./jobMeta";
import { applyManufacturingFixes, evaluateCabinetRules, formatManufacturingIssues, getMinDividersForShelfSpan, applyWallMountPlacementFix } from "./manufacturingRules";
import {
  clampDraftingDisplay,
  clampProjectDrafting,
  DEFAULT_DRAFTING,
  DEFAULT_DRAFTING_DISPLAY,
  type DraftingDisplayPreferences,
  type ProjectDrafting,
} from "./draftingAnnotations";
import {
  normalizeConstructionSpec,
  shelvesAreAdjustable,
  type CabinetConstructionSpec,
} from "./cabinetConstructionSpec";
import type { QuoteSettings, QuoteSnapshot } from "./quoteSettings";
import {
  clampQuoteHistory,
  clampQuoteSettings,
  DEFAULT_QUOTE_SETTINGS,
} from "./quoteSettings";

export type { CabinetComposition } from "./cabinetComposition";
export type { CabinetConstructionSpec } from "./cabinetConstructionSpec";
export type { ProjectDrafting, DraftingDisplayPreferences } from "./draftingAnnotations";
export type { QuoteSettings, QuoteSnapshot } from "./quoteSettings";
export type { CabinetType } from "./cabinetCapabilities";
export {
  isStorageType,
  supportsCountertop,
  supportsDoors,
  supportsDrawers,
  supportsEndPanels,
  supportsShelves,
  supportsToeKick,
  supportsWallPlacement,
} from "./cabinetCapabilities";
import {
  supportsDoors,
  supportsDrawers,
  supportsShelves,
  supportsToeKick,
} from "./cabinetCapabilities";

export type CabinetDimensions = {
  width: number;
  height: number;
  depth: number;
  boardThickness: number;
  backPanelThickness: number;
};

export type CabinetConfig = {
  type: CabinetType;
  dimensions: CabinetDimensions;
  shelfCount: number;
  hasDoors: boolean;
  drawerCount?: number;
  toeKickHeight: number;
  toeKickInset: number;
  leftEndPanel?: boolean;
  rightEndPanel?: boolean;
  buildRules?: Partial<CabinetBuildRules>;
  /** Structured Core Cabinets–style composition. Flat fields stay in sync for geometry. */
  composition?: CabinetComposition;
  /** How the carcass, shelves, doors, and drawer boxes are built. */
  construction?: CabinetConstructionSpec;
};

export type CabinetPlacement = {
  x: number;
  y: number;
  z: number;
  rotation: 0 | 90 | 180 | 270;
  attachment: "floor" | "back-wall" | "left-wall" | "right-wall";
};

export type CabinetInstance = {
  id: string;
  name: string;
  placement: CabinetPlacement;
  config: CabinetConfig;
  layerId?: string;
  groupId?: string | null;
};

export type CabinetLayer = {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
};

export type CabinetGroup = {
  id: string;
  name: string;
};

export type ProjectPreferences = {
  snapSizeMm: number;
  showGrid: boolean;
  autoSaveToBrowser: boolean;
  costing?: CostingSettings;
  quote?: QuoteSettings;
  standards?: ProjectStandards;
  drafting?: DraftingDisplayPreferences;
};

export type RoomBounds = {
  widthMm: number;
  depthMm: number;
  heightMm: number;
};

export type CabinetProject = {
  version: number;
  cabinets: CabinetInstance[];
  layers?: CabinetLayer[];
  groups?: CabinetGroup[];
  preferences?: ProjectPreferences;
  job?: ProjectJobMeta;
  drafting?: ProjectDrafting;
  quoteHistory?: QuoteSnapshot[];
};

export const CABINET_WIDTH_MIN_MM = 500;
export const CABINET_WIDTH_MAX_MM = 1800;
export const CABINET_WIDTH_STEP_MM = 10;
export const CABINET_HEIGHT_MIN_MM = 400;
export const CABINET_HEIGHT_MAX_MM = 2400;
export const CABINET_HEIGHT_STEP_MM = 10;
export const CABINET_DEPTH_MIN_MM = 300;
export const CABINET_DEPTH_MAX_MM = 900;
export const CABINET_DEPTH_STEP_MM = 10;
export const CABINET_SHELF_MIN = 0;
export const CABINET_SHELF_MAX = 6;
export const CABINET_DRAWER_MIN = 0;
export const CABINET_DRAWER_MAX = 8;
export const CABINET_TOE_KICK_HEIGHT_MIN_MM = 80;
export const CABINET_TOE_KICK_HEIGHT_MAX_MM = 180;
export const CABINET_TOE_KICK_INSET_MIN_MM = 20;
export const CABINET_TOE_KICK_INSET_MAX_MM = 120;
export const CABINET_GRID_SNAP_MM = 50;
export const CABINET_CLEARANCE_MM = 20;
export const ROOM_WIDTH_MM = 6000;
export const ROOM_DEPTH_MM = 4000;
export const ROOM_HEIGHT_MM = 2800;

export const cabinetTypeLabels: Record<CabinetType, string> = {
  base: "Base Cabinet",
  wall: "Wall Cabinet",
  tall: "Tall Cabinet",
  drawer: "Drawer Cabinet",
  sink: "Sink Cabinet",
  corner: "Corner Cabinet",
  "open-shelf": "Open Shelf Cabinet",
  almirah: "Almirah",
  table: "Table",
  chair: "Chair",
  sofa: "Sofa",
  mirror: "Mirror",
};

const cabinetTypePresets: Record<CabinetType, CabinetConfig> = {
  base: {
    type: "base",
    dimensions: {
      width: 900,
      height: 720,
      depth: 560,
      boardThickness: 18,
      backPanelThickness: 6,
    },
    shelfCount: 1,
    hasDoors: true,
    drawerCount: 0,
    toeKickHeight: 100,
    toeKickInset: 60,
    leftEndPanel: false,
    rightEndPanel: false,
    buildRules: {
      ...DEFAULT_BUILD_RULES,
      finishId: "wood-oak",
    },
  },
  wall: {
    type: "wall",
    dimensions: {
      width: 900,
      height: 720,
      depth: 320,
      boardThickness: 18,
      backPanelThickness: 6,
    },
    shelfCount: 1,
    hasDoors: true,
    drawerCount: 0,
    toeKickHeight: 0,
    toeKickInset: 0,
    leftEndPanel: false,
    rightEndPanel: false,
    buildRules: {
      ...DEFAULT_BUILD_RULES,
      finishId: "white-matte",
    },
  },
  tall: {
    type: "tall",
    dimensions: {
      width: 600,
      height: 2100,
      depth: 600,
      boardThickness: 18,
      backPanelThickness: 6,
    },
    shelfCount: 4,
    hasDoors: true,
    drawerCount: 0,
    toeKickHeight: 100,
    toeKickInset: 60,
    leftEndPanel: true,
    rightEndPanel: true,
    buildRules: {
      ...DEFAULT_BUILD_RULES,
      finishId: "wood-walnut",
    },
  },
  drawer: {
    type: "drawer",
    dimensions: {
      width: 900,
      height: 720,
      depth: 560,
      boardThickness: 18,
      backPanelThickness: 6,
    },
    shelfCount: 0,
    hasDoors: false,
    drawerCount: 3,
    toeKickHeight: 100,
    toeKickInset: 60,
    leftEndPanel: false,
    rightEndPanel: false,
    buildRules: {
      ...DEFAULT_BUILD_RULES,
      finishId: "grey",
      backPanelType: "grooved",
    },
  },
  sink: {
    type: "sink",
    dimensions: {
      width: 900,
      height: 720,
      depth: 600,
      boardThickness: 18,
      backPanelThickness: 6,
    },
    shelfCount: 0,
    hasDoors: true,
    drawerCount: 0,
    toeKickHeight: 100,
    toeKickInset: 60,
    leftEndPanel: false,
    rightEndPanel: false,
    buildRules: {
      ...DEFAULT_BUILD_RULES,
      finishId: "white-matte",
      backPanelType: "screwed",
    },
  },
  corner: {
    type: "corner",
    dimensions: {
      width: 1000,
      height: 720,
      depth: 1000,
      boardThickness: 18,
      backPanelThickness: 6,
    },
    shelfCount: 1,
    hasDoors: true,
    drawerCount: 0,
    toeKickHeight: 100,
    toeKickInset: 60,
    leftEndPanel: false,
    rightEndPanel: false,
    buildRules: {
      ...DEFAULT_BUILD_RULES,
      finishId: "wood-oak",
      backPanelType: "grooved",
    },
  },
  "open-shelf": {
    type: "open-shelf",
    dimensions: {
      width: 900,
      height: 720,
      depth: 360,
      boardThickness: 18,
      backPanelThickness: 6,
    },
    shelfCount: 3,
    hasDoors: false,
    drawerCount: 0,
    toeKickHeight: 100,
    toeKickInset: 60,
    leftEndPanel: false,
    rightEndPanel: false,
    buildRules: {
      ...DEFAULT_BUILD_RULES,
      finishId: "wood-oak",
      backPanelType: "none",
    },
  },
  almirah: {
    type: "almirah",
    dimensions: {
      width: 1200,
      height: 2200,
      depth: 600,
      boardThickness: 18,
      backPanelThickness: 6,
    },
    shelfCount: 4,
    hasDoors: true,
    drawerCount: 0,
    toeKickHeight: 80,
    toeKickInset: 40,
    leftEndPanel: true,
    rightEndPanel: true,
    buildRules: {
      ...DEFAULT_BUILD_RULES,
      finishId: "wood-walnut",
    },
  },
  table: {
    type: "table",
    dimensions: {
      width: 1400,
      height: 760,
      depth: 800,
      boardThickness: 36,
      backPanelThickness: 18,
    },
    shelfCount: 0,
    hasDoors: false,
    drawerCount: 0,
    toeKickHeight: 0,
    toeKickInset: 0,
    leftEndPanel: false,
    rightEndPanel: false,
    buildRules: {
      ...DEFAULT_BUILD_RULES,
    },
  },
  chair: {
    type: "chair",
    dimensions: {
      width: 500,
      height: 900,
      depth: 520,
      boardThickness: 30,
      backPanelThickness: 18,
    },
    shelfCount: 0,
    hasDoors: false,
    drawerCount: 0,
    toeKickHeight: 0,
    toeKickInset: 0,
    leftEndPanel: false,
    rightEndPanel: false,
    buildRules: {
      ...DEFAULT_BUILD_RULES,
    },
  },
  sofa: {
    type: "sofa",
    dimensions: {
      width: 1800,
      height: 820,
      depth: 900,
      boardThickness: 40,
      backPanelThickness: 30,
    },
    shelfCount: 0,
    hasDoors: false,
    drawerCount: 0,
    toeKickHeight: 0,
    toeKickInset: 0,
    leftEndPanel: false,
    rightEndPanel: false,
    buildRules: {
      ...DEFAULT_BUILD_RULES,
    },
  },
  mirror: {
    type: "mirror",
    dimensions: {
      width: 700,
      height: 1800,
      depth: 60,
      boardThickness: 40,
      backPanelThickness: 8,
    },
    shelfCount: 0,
    hasDoors: false,
    drawerCount: 0,
    toeKickHeight: 0,
    toeKickInset: 0,
    leftEndPanel: false,
    rightEndPanel: false,
    buildRules: {
      ...DEFAULT_BUILD_RULES,
      finishId: "white-matte",
    },
  },
};

export const defaultCabinetConfig = getDefaultCabinetConfig("base");

export const defaultCabinetProject: CabinetProject = {
  version: 1,
  cabinets: [
    {
      id: "cabinet-1",
      name: "Cabinet 1",
      placement: { x: 0, y: 0, z: 0, rotation: 0, attachment: "floor" },
      config: defaultCabinetConfig,
      layerId: "layer-default",
      groupId: null,
    },
  ],
  layers: [
    {
      id: "layer-default",
      name: "Default Layer",
      visible: true,
      locked: false,
    },
  ],
  groups: [],
  preferences: {
    snapSizeMm: CABINET_GRID_SNAP_MM,
    showGrid: true,
    autoSaveToBrowser: true,
    costing: { ...DEFAULT_COSTING_SETTINGS },
    quote: { ...DEFAULT_QUOTE_SETTINGS },
    standards: { ...DEFAULT_PROJECT_STANDARDS },
    drafting: { ...DEFAULT_DRAFTING_DISPLAY },
  },
  drafting: { ...DEFAULT_DRAFTING },
  quoteHistory: [],
  job: createDefaultJobMeta({
    projectNumber: "JOB-001",
    customerName: "",
    revision: "A",
    status: "draft",
  }),
};

export function getDefaultCabinetConfig(type: CabinetType): CabinetConfig {
  const preset = cabinetTypePresets[type];
  const base: CabinetConfig = {
    ...preset,
    dimensions: { ...preset.dimensions },
    buildRules: { ...(preset.buildRules ?? DEFAULT_BUILD_RULES) },
  };
  const composition = createDefaultComposition(type, base);

  return {
    ...base,
    ...syncFlatFieldsFromComposition(composition),
    composition,
    construction: normalizeConstructionSpec(type, undefined, {
      shelvesAdjustable: composition.shelves.adjustable,
    }),
  };
}

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
      standards: clampProjectStandards(
        project.preferences?.standards ?? defaultCabinetProject.preferences?.standards,
      ),
      drafting: clampDraftingDisplay(
        project.preferences?.drafting ?? defaultCabinetProject.preferences?.drafting,
      ),
    },
    drafting: clampProjectDrafting(project.drafting ?? defaultCabinetProject.drafting),
    quoteHistory: clampQuoteHistory(project.quoteHistory ?? defaultCabinetProject.quoteHistory),
    job: clampJobMeta(project.job ?? defaultCabinetProject.job),
  };
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

export function getCabinetValidationMessages(
  config: CabinetConfig,
  placement?: CabinetPlacement | null,
  roomHeightMm?: number,
): string[] {
  const safeConfig = clampCabinetConfig(config);
  return formatManufacturingIssues(
    evaluateCabinetRules(safeConfig, {
      placement: placement ?? null,
      roomHeightMm,
    }),
  );
}
