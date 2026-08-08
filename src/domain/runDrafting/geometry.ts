import {
  getFootprintDimensions,
  type CabinetInstance,
} from "../cabinetDimensions";
import type { CabinetRun } from "../cabinetLibrary";
import { formatRunDraftLabel, formatRunShortCode } from "./labels";
import type { RunGapSegment, RunPlanBounds } from "./types";

const GAP_ANNOTATION_MIN_MM = 8;

function runCabinets(run: CabinetRun, cabinets: CabinetInstance[]) {
  return run.cabinetIds
    .map((id) => cabinets.find((cabinet) => cabinet.id === id))
    .filter((cabinet): cabinet is CabinetInstance => Boolean(cabinet))
    .sort((a, b) =>
      run.axis === "x"
        ? a.placement.x - b.placement.x
        : a.placement.z - b.placement.z,
    );
}

export function buildRunPlanBounds(
  run: CabinetRun,
  cabinets: CabinetInstance[],
  index: number,
): RunPlanBounds | null {
  const members = runCabinets(run, cabinets);
  if (members.length === 0) return null;

  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;

  for (const cabinet of members) {
    const fp = getFootprintDimensions(
      cabinet.config.dimensions,
      cabinet.placement.rotation,
    );
    minX = Math.min(minX, cabinet.placement.x - fp.width / 2);
    maxX = Math.max(maxX, cabinet.placement.x + fp.width / 2);
    minZ = Math.min(minZ, cabinet.placement.z - fp.depth / 2);
    maxZ = Math.max(maxZ, cabinet.placement.z + fp.depth / 2);
  }

  const lengthMm = run.axis === "x" ? maxX - minX : maxZ - minZ;
  const depthMm = run.axis === "x" ? maxZ - minZ : maxX - minX;

  return {
    runId: run.id,
    index,
    axis: run.axis,
    side: run.side,
    minX,
    maxX,
    minZ,
    maxZ,
    centerX: (minX + maxX) / 2,
    centerZ: (minZ + maxZ) / 2,
    lengthMm,
    depthMm,
    cornerTransition: run.cornerTransition,
    shortCode: formatRunShortCode(index),
    label: formatRunDraftLabel(run, index),
  };
}

export function collectRunGapSegments(
  run: CabinetRun,
  cabinets: CabinetInstance[],
): RunGapSegment[] {
  const members = runCabinets(run, cabinets);
  if (members.length < 2) return [];

  const segments: RunGapSegment[] = [];
  for (let index = 0; index < members.length - 1; index += 1) {
    const current = members[index]!;
    const next = members[index + 1]!;
    const currentFp = getFootprintDimensions(
      current.config.dimensions,
      current.placement.rotation,
    );
    const nextFp = getFootprintDimensions(
      next.config.dimensions,
      next.placement.rotation,
    );
    const currentEnd =
      (run.axis === "x" ? current.placement.x : current.placement.z) +
      (run.axis === "x" ? currentFp.width : currentFp.depth) / 2;
    const nextStart =
      (run.axis === "x" ? next.placement.x : next.placement.z) -
      (run.axis === "x" ? nextFp.width : nextFp.depth) / 2;
    const gap = nextStart - currentEnd;
    if (gap < GAP_ANNOTATION_MIN_MM) continue;

    const center = currentEnd + gap / 2;
    const depth = Math.min(currentFp.depth, nextFp.depth);
    const widthAcross = Math.min(currentFp.width, nextFp.width);
    segments.push({
      runId: run.id,
      axis: run.axis,
      widthMm: gap,
      kind: gap >= 40 ? "filler" : "gap",
      position: {
        x: run.axis === "x" ? center : current.placement.x,
        y: 0,
        z: run.axis === "z" ? center : current.placement.z,
      },
      size: {
        width: run.axis === "x" ? gap : widthAcross,
        depth: run.axis === "x" ? depth : gap,
      },
    });
  }
  return segments;
}

export function buildAllRunPlanBounds(
  runs: CabinetRun[],
  cabinets: CabinetInstance[],
): RunPlanBounds[] {
  return runs
    .map((run, index) => buildRunPlanBounds(run, cabinets, index))
    .filter((bounds): bounds is RunPlanBounds => Boolean(bounds));
}
