import type { CabinetType } from "../cabinetDimensions";

export type CabinetRunSide = "back-wall" | "left-wall" | "right-wall" | "free";
export type CabinetRunAxis = "x" | "z";
export type CabinetRunBand = "base" | "wall" | "tall";

export type CabinetRun = {
  id: string;
  side: CabinetRunSide;
  axis: CabinetRunAxis;
  band: CabinetRunBand;
  cabinetIds: string[];
  cornerTransition: boolean;
};

export type RunFiller = {
  id: string;
  runId: string;
  side: "start" | "end" | "between";
  widthMm: number;
  position: { x: number; y: number; z: number };
  size: { width: number; height: number; depth: number };
};

export type CountertopEndCondition = "finished" | "wall" | "corner";

export type CountertopSegment = {
  id: string;
  runId: string;
  cabinetIds: string[];
  axis: CabinetRunAxis;
  widthMm: number;
  depthMm: number;
  thicknessMm: number;
  positionX: number;
  positionY: number;
  positionZ: number;
  endConditionStart: CountertopEndCondition;
  endConditionEnd: CountertopEndCondition;
};

export type CabinetPlanningWorkflow = {
  runs: CabinetRun[];
  fillers: RunFiller[];
  countertops: CountertopSegment[];
};

export const DEFAULT_COUNTERTOP_THICKNESS_MM = 28;
export const DEFAULT_COUNTERTOP_OVERHANG_FRONT_MM = 25;
export const DEFAULT_COUNTERTOP_OVERHANG_SIDE_MM = 20;

export const RUN_ALIGNMENT_TOLERANCE_MM = 120;
export const RUN_GAP_TOLERANCE_MM = 220;
export const RUN_SNAP_TOLERANCE_MM = 140;
export const FILLER_MIN_MM = 40;
export const FILLER_MAX_MM = 150;
export const CORNER_JOIN_TOLERANCE_MM = 180;

export function runBandForType(type: CabinetType): CabinetRunBand {
  if (type === "wall" || type === "mirror") return "wall";
  if (type === "tall" || type === "almirah") return "tall";
  return "base";
}
