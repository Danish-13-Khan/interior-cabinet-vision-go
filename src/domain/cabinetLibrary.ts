import {
  clampCabinetPlacement,
  getDefaultCabinetConfig,
  getFootprintDimensions,
  normalizeRotationAngle,
  supportsCountertop,
  type CabinetConfig,
  type CabinetInstance,
  type CabinetPlacement,
  type CabinetProject,
  type CabinetType,
  type RoomBounds,
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

export type CabinetRunSide = "back-wall" | "left-wall" | "right-wall" | "free";
export type CabinetRunAxis = "x" | "z";

export type CabinetRun = {
  id: string;
  side: CabinetRunSide;
  axis: CabinetRunAxis;
  cabinetIds: string[];
  cornerTransition: boolean;
};

export type RunFiller = {
  id: string;
  runId: string;
  side: "start" | "end";
  widthMm: number;
  position: { x: number; y: number; z: number };
  size: { width: number; height: number; depth: number };
};

export type CountertopEndCondition = "finished" | "wall" | "corner";

export type CountertopSegment = {
  id: string;
  runId: string;
  cabinetIds: string[];
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

const RUN_ALIGNMENT_TOLERANCE_MM = 120;
const RUN_GAP_TOLERANCE_MM = 220;
const FILLER_MIN_MM = 40;
const FILLER_MAX_MM = 150;

export function getCabinetFamilyDefaults(type: CabinetType): CabinetConfig {
  return getDefaultCabinetConfig(type);
}

function isRunCandidate(cabinet: CabinetInstance) {
  return cabinet.config.type !== "table" &&
    cabinet.config.type !== "chair" &&
    cabinet.config.type !== "sofa" &&
    cabinet.config.type !== "mirror";
}

function inferRunAxis(cabinet: CabinetInstance): CabinetRunAxis {
  return cabinet.placement.attachment === "left-wall" ||
    cabinet.placement.attachment === "right-wall" ||
    normalizeRotationAngle(cabinet.placement.rotation) === 90 ||
    normalizeRotationAngle(cabinet.placement.rotation) === 270
    ? "z"
    : "x";
}

function inferRunSide(cabinet: CabinetInstance, roomBounds: RoomBounds): CabinetRunSide {
  if (cabinet.placement.attachment !== "floor") {
    return cabinet.placement.attachment;
  }

  const footprint = getFootprintDimensions(
    cabinet.config.dimensions,
    cabinet.placement.rotation,
  );
  const nearBackWall = Math.abs(
    cabinet.placement.z - (-roomBounds.depthMm / 2 + footprint.depth / 2),
  ) < RUN_ALIGNMENT_TOLERANCE_MM;
  const nearLeftWall = Math.abs(
    cabinet.placement.x - (-roomBounds.widthMm / 2 + footprint.depth / 2),
  ) < RUN_ALIGNMENT_TOLERANCE_MM;
  const nearRightWall = Math.abs(
    cabinet.placement.x - (roomBounds.widthMm / 2 - footprint.depth / 2),
  ) < RUN_ALIGNMENT_TOLERANCE_MM;

  if (nearBackWall) return "back-wall";
  if (nearLeftWall) return "left-wall";
  if (nearRightWall) return "right-wall";
  return "free";
}

function getRunLineValue(cabinet: CabinetInstance, axis: CabinetRunAxis) {
  return axis === "x" ? cabinet.placement.z : cabinet.placement.x;
}

function getRunPrimaryValue(cabinet: CabinetInstance, axis: CabinetRunAxis) {
  return axis === "x" ? cabinet.placement.x : cabinet.placement.z;
}

function cabinetsAreAdjacent(
  first: CabinetInstance,
  second: CabinetInstance,
  axis: CabinetRunAxis,
) {
  const firstFootprint = getFootprintDimensions(first.config.dimensions, first.placement.rotation);
  const secondFootprint = getFootprintDimensions(second.config.dimensions, second.placement.rotation);

  const firstEnd = getRunPrimaryValue(first, axis) + (axis === "x" ? firstFootprint.width : firstFootprint.depth) / 2;
  const secondStart = getRunPrimaryValue(second, axis) - (axis === "x" ? secondFootprint.width : secondFootprint.depth) / 2;

  return secondStart - firstEnd <= RUN_GAP_TOLERANCE_MM;
}

export function detectCabinetRuns(
  cabinets: CabinetInstance[],
  roomBounds: RoomBounds,
): CabinetRun[] {
  const groups = new Map<string, CabinetInstance[]>();

  for (const cabinet of cabinets.filter(isRunCandidate)) {
    const axis = inferRunAxis(cabinet);
    const side = inferRunSide(cabinet, roomBounds);
    const lineBucket = Math.round(getRunLineValue(cabinet, axis) / RUN_ALIGNMENT_TOLERANCE_MM);
    const key = `${side}:${axis}:${lineBucket}`;
    const group = groups.get(key) ?? [];
    group.push(cabinet);
    groups.set(key, group);
  }

  const runs: CabinetRun[] = [];

  for (const [key, group] of groups) {
    const [side, axis] = key.split(":") as [CabinetRunSide, CabinetRunAxis];
    const sorted = [...group].sort(
      (a, b) => getRunPrimaryValue(a, axis) - getRunPrimaryValue(b, axis),
    );

    let current: CabinetInstance[] = [];
    for (const cabinet of sorted) {
      const previous = current[current.length - 1];
      if (!previous || cabinetsAreAdjacent(previous, cabinet, axis)) {
        current.push(cabinet);
      } else {
        if (current.length > 0) {
          runs.push({
            id: `run-${runs.length + 1}`,
            side,
            axis,
            cabinetIds: current.map((item) => item.id),
            cornerTransition: current.some((item) => item.config.type === "corner"),
          });
        }
        current = [cabinet];
      }
    }

    if (current.length > 0) {
      runs.push({
        id: `run-${runs.length + 1}`,
        side,
        axis,
        cabinetIds: current.map((item) => item.id),
        cornerTransition: current.some((item) => item.config.type === "corner"),
      });
    }
  }

  return runs;
}

export function createRunAlignedPlacements(
  run: CabinetRun,
  project: CabinetProject,
  roomBounds: RoomBounds,
): Record<string, CabinetPlacement> {
  const cabinets = run.cabinetIds
    .map((id) => project.cabinets.find((cabinet) => cabinet.id === id))
    .filter((cabinet): cabinet is CabinetInstance => Boolean(cabinet))
    .sort((a, b) => getRunPrimaryValue(a, run.axis) - getRunPrimaryValue(b, run.axis));

  if (cabinets.length === 0) {
    return {};
  }

  const placements: Record<string, CabinetPlacement> = {};
  let cursor = getRunPrimaryValue(cabinets[0], run.axis);

  for (let index = 0; index < cabinets.length; index += 1) {
    const cabinet = cabinets[index];
    const footprint = getFootprintDimensions(cabinet.config.dimensions, cabinet.placement.rotation);
    const span = run.axis === "x" ? footprint.width : footprint.depth;

    const nextPlacement: CabinetPlacement = {
      ...cabinet.placement,
      x: run.axis === "x" ? cursor + span / 2 : cabinet.placement.x,
      z: run.axis === "z" ? cursor + span / 2 : cabinet.placement.z,
    };

    placements[cabinet.id] = clampCabinetPlacement(
      nextPlacement,
      cabinet.config.dimensions,
      roomBounds,
    );

    cursor += span;
  }

  return placements;
}

function createRunFillers(
  run: CabinetRun,
  project: CabinetProject,
): RunFiller[] {
  const cabinets = run.cabinetIds
    .map((id) => project.cabinets.find((cabinet) => cabinet.id === id))
    .filter((cabinet): cabinet is CabinetInstance => Boolean(cabinet))
    .sort((a, b) => getRunPrimaryValue(a, run.axis) - getRunPrimaryValue(b, run.axis));

  if (cabinets.length < 2) {
    return [];
  }

  const fillers: RunFiller[] = [];

  for (let index = 0; index < cabinets.length - 1; index += 1) {
    const current = cabinets[index];
    const next = cabinets[index + 1];
    const currentFootprint = getFootprintDimensions(current.config.dimensions, current.placement.rotation);
    const nextFootprint = getFootprintDimensions(next.config.dimensions, next.placement.rotation);
    const currentEnd =
      getRunPrimaryValue(current, run.axis) +
      (run.axis === "x" ? currentFootprint.width : currentFootprint.depth) / 2;
    const nextStart =
      getRunPrimaryValue(next, run.axis) -
      (run.axis === "x" ? nextFootprint.width : nextFootprint.depth) / 2;
    const gap = nextStart - currentEnd;

    if (gap < FILLER_MIN_MM) {
      continue;
    }

    const fillerWidth = Math.min(gap, FILLER_MAX_MM);
    const fillerHeight = Math.min(current.config.dimensions.height, next.config.dimensions.height);
    const fillerDepth = Math.min(current.config.dimensions.depth, next.config.dimensions.depth);
    const centerPrimary = currentEnd + fillerWidth / 2;

    fillers.push({
      id: `filler-${run.id}-${index + 1}`,
      runId: run.id,
      side: "end",
      widthMm: fillerWidth,
      position: {
        x: run.axis === "x" ? centerPrimary : current.placement.x,
        y: 0,
        z: run.axis === "z" ? centerPrimary : current.placement.z,
      },
      size: {
        width: run.axis === "x" ? fillerWidth : current.config.dimensions.boardThickness,
        height: fillerHeight,
        depth: run.axis === "x" ? fillerDepth : fillerWidth,
      },
    });
  }

  return fillers;
}

function createCountertopsForRuns(
  runs: CabinetRun[],
  project: CabinetProject,
): CountertopSegment[] {
  const countertops: CountertopSegment[] = [];

  for (const run of runs) {
    const cabinets = run.cabinetIds
      .map((id) => project.cabinets.find((cabinet) => cabinet.id === id))
      .filter((cabinet): cabinet is CabinetInstance => Boolean(cabinet))
      .filter((cabinet) => supportsCountertop(cabinet.config.type));

    if (cabinets.length === 0) {
      continue;
    }

    const sorted = [...cabinets].sort(
      (a, b) => getRunPrimaryValue(a, run.axis) - getRunPrimaryValue(b, run.axis),
    );
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const maxDepth = Math.max(...sorted.map((cabinet) => cabinet.config.dimensions.depth));
    const firstFootprint = getFootprintDimensions(first.config.dimensions, first.placement.rotation);
    const lastFootprint = getFootprintDimensions(last.config.dimensions, last.placement.rotation);
    const start =
      getRunPrimaryValue(first, run.axis) -
      (run.axis === "x" ? firstFootprint.width : firstFootprint.depth) / 2 -
      DEFAULT_COUNTERTOP_OVERHANG_SIDE_MM;
    const end =
      getRunPrimaryValue(last, run.axis) +
      (run.axis === "x" ? lastFootprint.width : lastFootprint.depth) / 2 +
      DEFAULT_COUNTERTOP_OVERHANG_SIDE_MM;
    const widthMm = end - start;

    countertops.push({
      id: `countertop-${run.id}`,
      runId: run.id,
      cabinetIds: sorted.map((cabinet) => cabinet.id),
      widthMm,
      depthMm: maxDepth + DEFAULT_COUNTERTOP_OVERHANG_FRONT_MM,
      thicknessMm: DEFAULT_COUNTERTOP_THICKNESS_MM,
      positionX: run.axis === "x" ? start + widthMm / 2 : first.placement.x,
      positionY: Math.max(...sorted.map((cabinet) => cabinet.config.dimensions.height)),
      positionZ: run.axis === "z" ? start + widthMm / 2 : first.placement.z + DEFAULT_COUNTERTOP_OVERHANG_FRONT_MM / 2,
      endConditionStart: run.side === "free" ? "finished" : "wall",
      endConditionEnd: run.cornerTransition ? "corner" : "finished",
    });
  }

  return countertops;
}

export function createCabinetPlanningWorkflow(
  project: CabinetProject,
  roomBounds: RoomBounds,
): CabinetPlanningWorkflow {
  const runs = detectCabinetRuns(project.cabinets, roomBounds);

  return {
    runs,
    fillers: runs.flatMap((run) => createRunFillers(run, project)),
    countertops: createCountertopsForRuns(runs, project),
  };
}
