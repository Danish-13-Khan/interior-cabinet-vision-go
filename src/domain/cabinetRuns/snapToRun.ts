import {
  getFootprintDimensions,
  type CabinetInstance,
  type CabinetPlacement,
  type RoomBounds,
} from "../cabinetDimensions";
import { detectCabinetRuns } from "./detect";
import {
  cabinetRunBand,
  getRunExtent,
  getRunLineValue,
  getRunPrimaryValue,
  getRunSpan,
  inferRunAxis,
  inferRunSide,
  isRunCandidate,
  wallFaceLineValue,
} from "./geometry";
import {
  FILLER_MAX_MM,
  FILLER_MIN_MM,
  RUN_SNAP_TOLERANCE_MM,
  type CabinetRun,
} from "./types";

export type RunSnapGuide = {
  axis: "x" | "z" | "y";
  positionMm: number;
  kind: "grid" | "align" | "wall" | "adjacency";
};

export type RunSnapResult = {
  placement: CabinetPlacement;
  guides: RunSnapGuide[];
};

/**
 * Snap a moving cabinet onto nearby run lines, wall faces, and neighbor edges
 * (including filler-band gaps).
 */
export function snapPlacementIntoRuns(options: {
  cabinet: CabinetInstance;
  others: CabinetInstance[];
  proposed: CabinetPlacement;
  roomBounds: RoomBounds;
  runs?: CabinetRun[];
}): RunSnapResult {
  const { cabinet, others, proposed, roomBounds } = options;
  const guides: RunSnapGuide[] = [];
  let placement = { ...proposed };

  if (!isRunCandidate({ ...cabinet, placement })) {
    return { placement, guides };
  }

  const axis = inferRunAxis({ ...cabinet, placement });
  const side = inferRunSide({ ...cabinet, placement }, roomBounds);
  const footprint = getFootprintDimensions(
    cabinet.config.dimensions,
    placement.rotation,
  );
  const band = cabinetRunBand(cabinet);
  const runs =
    options.runs?.filter((run) => run.band === band) ??
    detectCabinetRuns(others, roomBounds).filter((run) => run.band === band);

  // Prefer matching existing runs of same band/side/axis.
  const candidates = runs.filter(
    (run) =>
      run.band === band &&
      (run.side === side || run.side === "free" || side === "free") &&
      run.axis === axis,
  );

  let bestLine: number | null = null;
  let bestLineDelta = RUN_SNAP_TOLERANCE_MM;

  for (const run of candidates) {
    const members = run.cabinetIds
      .map((id) => others.find((item) => item.id === id))
      .filter((item): item is CabinetInstance => Boolean(item));
    if (members.length === 0) continue;

    const line =
      members.reduce((sum, item) => sum + getRunLineValue(item, axis), 0) /
      members.length;
    const currentLine = axis === "x" ? placement.z : placement.x;
    const delta = Math.abs(currentLine - line);
    if (delta < bestLineDelta) {
      bestLineDelta = delta;
      bestLine = line;
    }
  }

  // Wall face flush for wall-side runs.
  const wallLine = wallFaceLineValue(side, footprint.depth, roomBounds);
  if (wallLine != null) {
    const currentLine = axis === "x" ? placement.z : placement.x;
    if (Math.abs(currentLine - wallLine) < RUN_SNAP_TOLERANCE_MM) {
      bestLine = wallLine;
      bestLineDelta = Math.abs(currentLine - wallLine);
    }
  }

  if (bestLine != null) {
    if (axis === "x") {
      placement = { ...placement, z: bestLine };
      guides.push({ axis: "z", positionMm: bestLine, kind: "align" });
    } else {
      placement = { ...placement, x: bestLine };
      guides.push({ axis: "x", positionMm: bestLine, kind: "align" });
    }
  }

  // Neighbor edge / filler-gap snap along run axis.
  const span = getRunSpan({ ...cabinet, placement }, axis);
  const primary = getRunPrimaryValue({ ...cabinet, placement }, axis);
  let bestPrimary = primary;
  let bestPrimaryDelta = RUN_SNAP_TOLERANCE_MM;

  for (const other of others.filter(isRunCandidate)) {
    if (cabinetRunBand(other) !== band) continue;
    if (inferRunAxis(other) !== axis) continue;

    const extent = getRunExtent(other, axis);
    const targets = [
      extent.end + span / 2, // butt join after
      extent.start - span / 2, // butt join before
      extent.end + (FILLER_MIN_MM + FILLER_MAX_MM) / 4 + span / 2, // soft filler gap
    ];

    for (const target of targets) {
      const delta = Math.abs(primary - target);
      if (delta < bestPrimaryDelta) {
        bestPrimaryDelta = delta;
        bestPrimary = target;
      }
    }
  }

  if (bestPrimary !== primary) {
    if (axis === "x") {
      placement = { ...placement, x: bestPrimary };
      guides.push({ axis: "x", positionMm: bestPrimary, kind: "adjacency" });
    } else {
      placement = { ...placement, z: bestPrimary };
      guides.push({ axis: "z", positionMm: bestPrimary, kind: "adjacency" });
    }
  }

  return { placement, guides };
}
