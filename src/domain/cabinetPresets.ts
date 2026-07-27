import type { CabinetConfig, CabinetType } from "./cabinetDimensions";
import { getDefaultCabinetConfig } from "./cabinetDimensions";
import {
  createDefaultComposition,
  normalizeComposition,
  syncFlatFieldsFromComposition,
  type CabinetComposition,
} from "./cabinetComposition";

export type EngineeredCabinetPreset = {
  id: string;
  label: string;
  family: CabinetType;
  description: string;
  config: CabinetConfig;
};

function withComposition(
  family: CabinetType,
  overrides: Omit<Partial<CabinetConfig>, "composition"> & {
    composition?: Partial<CabinetComposition>;
  } = {},
): CabinetConfig {
  const base = getDefaultCabinetConfig(family);
  const seed: CabinetConfig = {
    ...base,
    ...overrides,
    dimensions: {
      ...base.dimensions,
      ...(overrides.dimensions ?? {}),
    },
    buildRules: {
      ...(base.buildRules ?? {}),
      ...(overrides.buildRules ?? {}),
    },
    composition: base.composition,
  };
  const defaults = createDefaultComposition(family, seed);
  const widthMm = seed.dimensions.width;
  const compositionSeed: CabinetComposition = {
    ...defaults,
    ...overrides.composition,
    shelves: {
      ...defaults.shelves,
      ...(overrides.composition?.shelves ?? {}),
    },
    dividers: {
      ...defaults.dividers,
      ...(overrides.composition?.dividers ?? {}),
    },
    doors: {
      ...defaults.doors,
      ...(overrides.composition?.doors ?? {}),
    },
    drawers: {
      ...defaults.drawers,
      ...(overrides.composition?.drawers ?? {}),
    },
    toeKick: {
      ...defaults.toeKick,
      ...(overrides.composition?.toeKick ?? {}),
    },
    fillers: {
      ...defaults.fillers,
      ...(overrides.composition?.fillers ?? {}),
    },
    endPanels: {
      ...defaults.endPanels,
      ...(overrides.composition?.endPanels ?? {}),
    },
    openings: overrides.composition?.openings ?? defaults.openings,
    // When a preset supplies opening style / door-drawer intent, migrate unless
    // an explicit openingStructure is provided.
    openingStructure: overrides.composition
      ? overrides.composition.openingStructure
      : defaults.openingStructure,
  };

  const composition = normalizeComposition(family, compositionSeed, widthMm);

  return {
    ...seed,
    ...syncFlatFieldsFromComposition(composition),
    composition,
  };
}

export const ENGINEERED_CABINET_PRESETS: EngineeredCabinetPreset[] = [
  {
    id: "base-900-single-door",
    label: "900 Base · 1 Door",
    family: "base",
    description: "Standard 900 mm base with single door and one adjustable shelf",
    config: withComposition("base", {
      dimensions: { width: 900, height: 720, depth: 560, boardThickness: 18, backPanelThickness: 6 },
      composition: {
        doors: { enabled: true, style: "single", hinge: "left", count: 1 },
        shelves: { count: 1, adjustable: true },
        drawers: { count: 0, equalHeights: true },
        openings: [{ id: "opening-primary", label: "Door Bay", style: "door" }],
      },
    }),
  },
  {
    id: "base-900-double-door",
    label: "900 Base · 2 Door",
    family: "base",
    description: "Standard double-door base cabinet",
    config: withComposition("base", {
      dimensions: { width: 900, height: 720, depth: 560, boardThickness: 18, backPanelThickness: 6 },
      composition: {
        doors: { enabled: true, style: "double", hinge: "both", count: 2 },
        shelves: { count: 1, adjustable: true },
        drawers: { count: 0, equalHeights: true },
        openings: [{ id: "opening-primary", label: "Door Bay", style: "door" }],
      },
    }),
  },
  {
    id: "base-600-drawer-stack",
    label: "600 Base · 3 Drawer",
    family: "base",
    description: "Narrow drawer base with equal-height fronts",
    config: withComposition("base", {
      dimensions: { width: 600, height: 720, depth: 560, boardThickness: 18, backPanelThickness: 6 },
      composition: {
        doors: { enabled: false, style: "none", hinge: "both", count: 0 },
        shelves: { count: 0, adjustable: false },
        drawers: { count: 3, equalHeights: true },
        openings: [{ id: "opening-primary", label: "Drawer Stack", style: "drawer" }],
      },
    }),
  },
  {
    id: "base-900-drawer-over-doors",
    label: "900 Base · Drawer over Doors",
    family: "base",
    description: "Mixed opening with one top drawer and double doors below",
    config: withComposition("base", {
      dimensions: { width: 900, height: 720, depth: 560, boardThickness: 18, backPanelThickness: 6 },
      composition: {
        doors: { enabled: true, style: "double", hinge: "both", count: 2 },
        shelves: { count: 1, adjustable: true },
        drawers: { count: 1, equalHeights: true },
        openings: [{ id: "opening-primary", label: "Mixed Bay", style: "mixed" }],
      },
    }),
  },
  {
    id: "wall-900-double",
    label: "900 Wall · 2 Door",
    family: "wall",
    description: "Wall cabinet with double doors and one shelf",
    config: withComposition("wall", {
      dimensions: { width: 900, height: 720, depth: 320, boardThickness: 18, backPanelThickness: 6 },
      composition: {
        doors: { enabled: true, style: "double", hinge: "both", count: 2 },
        shelves: { count: 1, adjustable: true },
        toeKick: { enabled: false, heightMm: 0, insetMm: 0 },
      },
    }),
  },
  {
    id: "wall-600-open",
    label: "600 Wall · Open Shelf",
    family: "wall",
    description: "Open wall bay with two adjustable shelves",
    config: withComposition("wall", {
      dimensions: { width: 600, height: 720, depth: 320, boardThickness: 18, backPanelThickness: 6 },
      composition: {
        doors: { enabled: false, style: "none", hinge: "both", count: 0 },
        shelves: { count: 2, adjustable: true },
        openings: [{ id: "opening-primary", label: "Open Bay", style: "open" }],
        toeKick: { enabled: false, heightMm: 0, insetMm: 0 },
      },
    }),
  },
  {
    id: "tall-pantry-600",
    label: "600 Tall Pantry",
    family: "tall",
    description: "Full-height pantry with shelves, doors, and finished ends",
    config: withComposition("tall", {
      dimensions: { width: 600, height: 2100, depth: 600, boardThickness: 18, backPanelThickness: 6 },
      composition: {
        doors: { enabled: true, style: "single", hinge: "left", count: 1 },
        shelves: { count: 5, adjustable: true },
        drawers: { count: 0, equalHeights: true },
        endPanels: { left: true, right: true },
        openings: [{ id: "opening-primary", label: "Pantry Bay", style: "door" }],
      },
    }),
  },
  {
    id: "tall-oven-tower",
    label: "600 Oven Tower",
    family: "tall",
    description: "Tall unit with drawers below and door bay above",
    config: withComposition("tall", {
      dimensions: { width: 600, height: 2100, depth: 600, boardThickness: 18, backPanelThickness: 6 },
      composition: {
        doors: { enabled: true, style: "single", hinge: "left", count: 1 },
        shelves: { count: 2, adjustable: true },
        drawers: { count: 2, equalHeights: true },
        openings: [{ id: "opening-primary", label: "Oven Tower", style: "mixed" }],
        endPanels: { left: true, right: true },
      },
    }),
  },
  {
    id: "drawer-900-bank",
    label: "900 Drawer Bank",
    family: "drawer",
    description: "Three-drawer engineered bank",
    config: withComposition("drawer", {
      dimensions: { width: 900, height: 720, depth: 560, boardThickness: 18, backPanelThickness: 6 },
      composition: {
        drawers: { count: 3, equalHeights: true },
        shelves: { count: 0, adjustable: false },
        doors: { enabled: false, style: "none", hinge: "both", count: 0 },
        openings: [{ id: "opening-primary", label: "Drawer Bank", style: "drawer" }],
      },
    }),
  },
  {
    id: "sink-900",
    label: "900 Sink Base",
    family: "sink",
    description: "Sink carcass with double doors and no shelves",
    config: withComposition("sink", {
      dimensions: { width: 900, height: 720, depth: 600, boardThickness: 18, backPanelThickness: 6 },
      composition: {
        doors: { enabled: true, style: "double", hinge: "both", count: 2 },
        shelves: { count: 0, adjustable: false },
        openings: [{ id: "opening-primary", label: "Sink Bay", style: "open" }],
      },
    }),
  },
  {
    id: "corner-blind-1000",
    label: "1000 Blind Corner",
    family: "corner",
    description: "Corner base with return divider and door access",
    config: withComposition("corner", {
      dimensions: { width: 1000, height: 720, depth: 1000, boardThickness: 18, backPanelThickness: 6 },
      composition: {
        dividers: { count: 1 },
        doors: { enabled: true, style: "single", hinge: "left", count: 1 },
        shelves: { count: 1, adjustable: true },
        openings: [{ id: "opening-primary", label: "Corner Opening", style: "door" }],
      },
    }),
  },
  {
    id: "open-shelf-900",
    label: "900 Open Shelf",
    family: "open-shelf",
    description: "Open display carcass with three shelves",
    config: withComposition("open-shelf", {
      dimensions: { width: 900, height: 720, depth: 360, boardThickness: 18, backPanelThickness: 6 },
      composition: {
        shelves: { count: 3, adjustable: true },
        doors: { enabled: false, style: "none", hinge: "both", count: 0 },
        openings: [{ id: "opening-primary", label: "Open Bay", style: "open" }],
      },
    }),
  },
];

export function getEngineeredCabinetPreset(id: string): EngineeredCabinetPreset | null {
  return ENGINEERED_CABINET_PRESETS.find((preset) => preset.id === id) ?? null;
}

export function listEngineeredPresetsForFamily(family: CabinetType): EngineeredCabinetPreset[] {
  return ENGINEERED_CABINET_PRESETS.filter((preset) => preset.family === family);
}
