import {
  supportsCountertop,
  type CabinetInstance,
  type CabinetProject,
} from "../cabinetDimensions";
import {
  cabinetsAreAdjacent,
  getRunExtent,
  getRunPrimaryValue,
  orderedRunCabinets,
} from "./geometry";
import {
  DEFAULT_COUNTERTOP_OVERHANG_FRONT_MM,
  DEFAULT_COUNTERTOP_OVERHANG_SIDE_MM,
  DEFAULT_COUNTERTOP_THICKNESS_MM,
  RUN_GAP_TOLERANCE_MM,
  type CabinetRun,
  type CountertopSegment,
} from "./types";

/** Shift the extra front depth into the room, not into the wall. */
function frontOverhangCenterMm(run: CabinetRun, lineValue: number) {
  const shift = DEFAULT_COUNTERTOP_OVERHANG_FRONT_MM / 2;
  return run.side === "right-wall" ? lineValue - shift : lineValue + shift;
}

function splitCountertopGroups(
  cabinets: CabinetInstance[],
  axis: CabinetRun["axis"],
): CabinetInstance[][] {
  if (cabinets.length === 0) return [];
  const sorted = [...cabinets].sort(
    (a, b) => getRunPrimaryValue(a, axis) - getRunPrimaryValue(b, axis),
  );
  const groups: CabinetInstance[][] = [];
  let current: CabinetInstance[] = [sorted[0]!];

  for (let index = 1; index < sorted.length; index += 1) {
    const cabinet = sorted[index]!;
    const previous = current[current.length - 1]!;
    if (
      !previous.config.countertopBreakAfter &&
      cabinetsAreAdjacent(previous, cabinet, axis, RUN_GAP_TOLERANCE_MM)
    ) {
      current.push(cabinet);
    } else {
      groups.push(current);
      current = [cabinet];
    }
  }
  groups.push(current);
  return groups;
}

function buildSegment(
  run: CabinetRun,
  group: CabinetInstance[],
  segmentIndex: number,
  isFirstGroup: boolean,
  isLastGroup: boolean,
): CountertopSegment {
  const sorted = [...group].sort(
    (a, b) => getRunPrimaryValue(a, run.axis) - getRunPrimaryValue(b, run.axis),
  );
  const first = sorted[0]!;
  const last = sorted[sorted.length - 1]!;
  const maxDepth = Math.max(
    ...sorted.map((cabinet) => cabinet.config.dimensions.depth),
  );
  const start =
    getRunExtent(first, run.axis).start - DEFAULT_COUNTERTOP_OVERHANG_SIDE_MM;
  const end =
    getRunExtent(last, run.axis).end + DEFAULT_COUNTERTOP_OVERHANG_SIDE_MM;
  const widthMm = end - start;
  const lineValue =
    run.axis === "x"
      ? Math.min(...sorted.map((cabinet) => cabinet.placement.z))
      : Math.min(...sorted.map((cabinet) => cabinet.placement.x));

  const startsAtWall = isFirstGroup && run.side !== "free";
  const endsAtCorner =
    isLastGroup &&
    (run.cornerTransition ||
      sorted.some((cabinet) => cabinet.config.type === "corner"));
  const runCenter = start + widthMm / 2;
  const crossCenter = frontOverhangCenterMm(run, lineValue);

  return {
    id: `countertop-${run.id}-${segmentIndex + 1}`,
    runId: run.id,
    cabinetIds: sorted.map((cabinet) => cabinet.id),
    axis: run.axis,
    widthMm,
    depthMm: maxDepth + DEFAULT_COUNTERTOP_OVERHANG_FRONT_MM,
    thicknessMm: DEFAULT_COUNTERTOP_THICKNESS_MM,
    positionX: run.axis === "x" ? runCenter : crossCenter,
    positionY: Math.max(
      ...sorted.map((cabinet) => cabinet.config.dimensions.height),
    ),
    positionZ: run.axis === "z" ? runCenter : crossCenter,
    endConditionStart: startsAtWall ? "wall" : "finished",
    endConditionEnd: endsAtCorner ? "corner" : "finished",
  };
}

/** Countertops follow base-band runs only, split where CT-eligible cabinets break. */
export function createCountertopsForRuns(
  runs: CabinetRun[],
  project: CabinetProject,
): CountertopSegment[] {
  const countertops: CountertopSegment[] = [];

  for (const run of runs) {
    if (run.band !== "base") continue;

    const cabinets = orderedRunCabinets(
      run.cabinetIds,
      project.cabinets,
      run.axis,
    ).filter((cabinet) => supportsCountertop(cabinet.config.type));

    const groups = splitCountertopGroups(cabinets, run.axis);
    groups.forEach((group, index) => {
      countertops.push(
        buildSegment(
          run,
          group,
          index,
          index === 0,
          index === groups.length - 1,
        ),
      );
    });
  }

  return countertops;
}
