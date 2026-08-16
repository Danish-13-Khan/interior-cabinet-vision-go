import { DEFAULT_BUILD_RULES } from "../materialSystem";
import {
  createDefaultComposition,
  syncFlatFieldsFromComposition,
} from "../cabinetComposition";
import type { CabinetType } from "../cabinetCapabilities";
import { DEFAULT_COSTING_SETTINGS } from "../costingSettings";
import { DEFAULT_PROJECT_STANDARDS } from "../projectStandards";
import { createDefaultJobMeta } from "../jobMeta";
import {
  DEFAULT_DRAFTING,
  DEFAULT_DRAFTING_DISPLAY,
} from "../draftingAnnotations";
import { normalizeConstructionSpec } from "../cabinetConstructionSpec";
import { DEFAULT_QUOTE_SETTINGS } from "../quoteSettings";
import { DEFAULT_SHEET_OPTIMIZER } from "../sheetStock";
import { normalizeCabinetHardware } from "../hardwareSystem";
import { getMinDividersForShelfSpan } from "../manufacturingRules";
import type { CabinetConfig, CabinetProject } from "./types";

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
  drawer: "Drawer Bank",
  sink: "Sink Base",
  corner: "Corner Cabinet",
  "open-shelf": "Open Shelf",
  almirah: "Almirah",
  table: "Table",
  chair: "Chair",
  sofa: "Sofa",
  mirror: "Mirror",
};

export const cabinetTypePresets: Record<CabinetType, CabinetConfig> = {
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
      width: 600,
      height: 600,
      depth: 350,
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

export function getDefaultCabinetConfig(type: CabinetType): CabinetConfig {
  const preset = cabinetTypePresets[type];
  const base: CabinetConfig = {
    ...preset,
    dimensions: { ...preset.dimensions },
    buildRules: { ...(preset.buildRules ?? DEFAULT_BUILD_RULES) },
  };
  const composition = createDefaultComposition(type, base);
  const draft: CabinetConfig = {
    ...base,
    ...syncFlatFieldsFromComposition(composition),
    composition,
    construction: normalizeConstructionSpec(type, undefined, {
      shelvesAdjustable: composition.shelves.adjustable,
    }),
    hardware: normalizeCabinetHardware(type, undefined),
  };
  const minDividers = getMinDividersForShelfSpan(draft);
  if (minDividers <= composition.dividers.count) {
    return draft;
  }
  return {
    ...draft,
    composition: {
      ...composition,
      dividers: {
        ...composition.dividers,
        count: minDividers,
      },
    },
  };
}

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
    sheetOptimizer: { ...DEFAULT_SHEET_OPTIMIZER },
    standards: { ...DEFAULT_PROJECT_STANDARDS },
    drafting: { ...DEFAULT_DRAFTING_DISPLAY },
  },
  drafting: { ...DEFAULT_DRAFTING },
  quoteHistory: [],
  reviewNotes: [],
  revisionHistory: [],
  job: createDefaultJobMeta({
    projectNumber: "JOB-001",
    customerName: "",
    revision: "A",
    status: "draft",
  }),
};
