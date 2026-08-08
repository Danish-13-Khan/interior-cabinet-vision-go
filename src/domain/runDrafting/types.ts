import type {
  CabinetRun,
  CabinetRunAxis,
  CabinetRunSide,
  CountertopEndCondition,
  CountertopSegment,
  RunFiller,
} from "../cabinetLibrary";

export type RunPlanBounds = {
  runId: string;
  index: number;
  axis: CabinetRunAxis;
  side: CabinetRunSide;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  centerX: number;
  centerZ: number;
  lengthMm: number;
  depthMm: number;
  cornerTransition: boolean;
  shortCode: string;
  label: string;
};

export type RunGapSegment = {
  runId: string;
  axis: CabinetRunAxis;
  widthMm: number;
  kind: "filler" | "gap";
  position: { x: number; y: number; z: number };
  size: { width: number; depth: number };
};

export type RunDraftingOptions = {
  showRunBands: boolean;
  showRunLabels: boolean;
  showFillers: boolean;
  showCountertopSpans: boolean;
  showDimensionChains: boolean;
  dimMinSegmentMm: number;
};

export type { CabinetRun, CountertopSegment, RunFiller, CountertopEndCondition };
