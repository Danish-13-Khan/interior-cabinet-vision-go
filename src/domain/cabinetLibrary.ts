import {
  getDefaultCabinetConfig,
  type CabinetConfig,
  type CabinetType,
} from "./cabinetDimensions";

export type CabinetLibraryCategory = {
  id: string;
  label: string;
  types: CabinetType[];
};

export const cabinetLibrary: CabinetLibraryCategory[] = [
  {
    id: "base-cabinets",
    label: "Base Cabinets",
    types: ["base", "drawer", "sink", "corner", "open-shelf"],
  },
  {
    id: "wall-cabinets",
    label: "Wall Cabinets",
    types: ["wall"],
  },
  {
    id: "tall-cabinets",
    label: "Tall Cabinets",
    types: ["tall", "almirah"],
  },
];

export function getCabinetFamilyDefaults(type: CabinetType): CabinetConfig {
  return getDefaultCabinetConfig(type);
}

// Planning workflow lives in cabinetRuns — re-exported for existing imports.
export type {
  CabinetPlanningWorkflow,
  CabinetRun,
  CabinetRunAxis,
  CabinetRunBand,
  CabinetRunSide,
  CountertopEndCondition,
  CountertopSegment,
  RunFiller,
} from "./cabinetRuns";
export {
  DEFAULT_COUNTERTOP_OVERHANG_FRONT_MM,
  DEFAULT_COUNTERTOP_OVERHANG_SIDE_MM,
  DEFAULT_COUNTERTOP_THICKNESS_MM,
  createAllRunAlignedPlacements,
  createCabinetPlanningWorkflow,
  createCountertopsForRuns,
  createRunAlignedPlacements,
  createRunFillers,
  detectCabinetRuns,
  snapPlacementIntoRuns,
} from "./cabinetRuns";
