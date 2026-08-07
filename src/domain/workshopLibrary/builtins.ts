import type { DoorStyle } from "../cabinetOpeningStructure";
import {
  clampProjectStandards,
  DEFAULT_PROJECT_STANDARDS,
} from "../projectStandards";
import { MATERIAL_PRESETS } from "../materialSystem";
import type {
  CountertopLibraryEntry,
  DoorStyleLibraryEntry,
  MaterialLibraryEntry,
  StandardsLibraryEntry,
} from "./types";

export const BUILTIN_DOOR_STYLE_LIBRARY: DoorStyleLibraryEntry[] = [
  {
    id: "door-single",
    label: "Single door",
    doorStyle: "single",
    description: "One hinged leaf",
    version: 1,
  },
  {
    id: "door-double",
    label: "Double doors",
    doorStyle: "double",
    description: "Paired leaves",
    version: 1,
  },
  {
    id: "door-bifold",
    label: "Bi-fold",
    doorStyle: "bi-fold",
    description: "Folding leaf pair",
    version: 1,
  },
];

export const BUILTIN_MATERIAL_LIBRARY: MaterialLibraryEntry[] = MATERIAL_PRESETS.map(
  (preset) => ({
    id: `material-${preset.id}`,
    label: preset.label,
    materialPresetId: preset.id,
    finishId: preset.spec.doorMaterial.finishId,
    edgeBandingId: preset.spec.carcassMaterial.edgeBandingId,
    description: preset.description,
    version: 1,
  }),
);

export const BUILTIN_COUNTERTOP_LIBRARY: CountertopLibraryEntry[] = [
  {
    id: "ct-standard-laminate",
    label: "Standard laminate 28 mm",
    thicknessMm: 28,
    overhangFrontMm: 30,
    overhangSidesMm: 20,
    materialLabel: "Laminate",
    description: "Default kitchen worktop",
    version: 1,
  },
  {
    id: "ct-compact-20",
    label: "Compact 20 mm",
    thicknessMm: 20,
    overhangFrontMm: 25,
    overhangSidesMm: 15,
    materialLabel: "Compact laminate",
    description: "Thinner commercial top",
    version: 1,
  },
  {
    id: "ct-stone-30",
    label: "Stone look 30 mm",
    thicknessMm: 30,
    overhangFrontMm: 35,
    overhangSidesMm: 20,
    materialLabel: "Quartz / stone",
    description: "Heavier visual top profile",
    version: 1,
  },
];

export const BUILTIN_STANDARDS_PACKS: StandardsLibraryEntry[] = [
  {
    id: "standards-workshop-default",
    label: "Workshop default",
    description: "Standard 18 mm carcass with painted finish",
    standards: { ...DEFAULT_PROJECT_STANDARDS },
    version: 1,
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "standards-economy",
    label: "Economy particle",
    description: "16 mm carcass, laminate economy pack",
    standards: clampProjectStandards({
      ...DEFAULT_PROJECT_STANDARDS,
      carcassThicknessMm: 16,
      materialPresetId: "particle-economy",
      finishId: "laminate",
      edgeBandingId: "abs-1mm",
    }),
    version: 1,
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "standards-premium-ply",
    label: "Premium plywood",
    description: "18 mm ply carcass with walnut finish",
    standards: clampProjectStandards({
      ...DEFAULT_PROJECT_STANDARDS,
      materialPresetId: "ply-premium",
      finishId: "wood-walnut",
      edgeBandingId: "veneer",
    }),
    version: 1,
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

export const DOOR_STYLES: DoorStyle[] = ["none", "single", "double", "bi-fold"];
