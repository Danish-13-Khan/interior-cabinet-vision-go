import type { CabinetInstance, RoomBounds } from "../cabinetDimensions";
import {
  cabinetsAreAdjacent,
  cabinetRunBand,
  getRunLineValue,
  getRunPrimaryValue,
  inferRunAxis,
  inferRunSide,
  isRunCandidate,
} from "./geometry";
import {
  CORNER_JOIN_TOLERANCE_MM,
  RUN_ALIGNMENT_TOLERANCE_MM,
  RUN_GAP_TOLERANCE_MM,
  type CabinetRun,
  type CabinetRunAxis,
  type CabinetRunBand,
  type CabinetRunSide,
} from "./types";

function runTouchesRoomCorner(
  cabinets: CabinetInstance[],
  side: CabinetRunSide,
  axis: CabinetRunAxis,
  roomBounds: RoomBounds,
) {
  if (cabinets.length === 0 || side === "free") return false;
  const halfW = roomBounds.widthMm / 2;
  const halfD = roomBounds.depthMm / 2;

  for (const cabinet of cabinets) {
    if (cabinet.config.type === "corner") return true;
    const x = cabinet.placement.x;
    const z = cabinet.placement.z;
    const nearLeft = Math.abs(x - -halfW) < CORNER_JOIN_TOLERANCE_MM + 400;
    const nearRight = Math.abs(x - halfW) < CORNER_JOIN_TOLERANCE_MM + 400;
    const nearBack = Math.abs(z - -halfD) < CORNER_JOIN_TOLERANCE_MM + 400;

    if (side === "back-wall" && (nearLeft || nearRight)) return true;
    if (side === "left-wall" && nearBack) return true;
    if (side === "right-wall" && nearBack) return true;
    if (axis === "x" && (nearLeft || nearRight) && nearBack) return true;
    if (axis === "z" && nearBack && (nearLeft || nearRight)) return true;
  }
  return false;
}

function markCornerTransitions(runs: CabinetRun[], cabinets: CabinetInstance[]) {
  const byId = new Map(cabinets.map((cabinet) => [cabinet.id, cabinet]));

  for (const run of runs) {
    const members = run.cabinetIds
      .map((id) => byId.get(id))
      .filter((cabinet): cabinet is CabinetInstance => Boolean(cabinet));
    if (members.some((cabinet) => cabinet.config.type === "corner")) {
      run.cornerTransition = true;
    }
  }

  // Orthogonal wall runs that nearly meet share a corner transition.
  for (let i = 0; i < runs.length; i += 1) {
    for (let j = i + 1; j < runs.length; j += 1) {
      const a = runs[i]!;
      const b = runs[j]!;
      if (a.band !== b.band) continue;
      if (a.axis === b.axis) continue;
      if (a.side === "free" || b.side === "free") continue;

      const aCabinets = a.cabinetIds
        .map((id) => byId.get(id))
        .filter((cabinet): cabinet is CabinetInstance => Boolean(cabinet));
      const bCabinets = b.cabinetIds
        .map((id) => byId.get(id))
        .filter((cabinet): cabinet is CabinetInstance => Boolean(cabinet));

      let joined = false;
      for (const first of aCabinets) {
        for (const second of bCabinets) {
          const dx = Math.abs(first.placement.x - second.placement.x);
          const dz = Math.abs(first.placement.z - second.placement.z);
          if (dx <= CORNER_JOIN_TOLERANCE_MM + 500 && dz <= CORNER_JOIN_TOLERANCE_MM + 500) {
            joined = true;
            break;
          }
        }
        if (joined) break;
      }
      if (joined) {
        a.cornerTransition = true;
        b.cornerTransition = true;
      }
    }
  }
}

export function detectCabinetRuns(
  cabinets: CabinetInstance[],
  roomBounds: RoomBounds,
): CabinetRun[] {
  const groups = new Map<string, CabinetInstance[]>();

  for (const cabinet of cabinets.filter(isRunCandidate)) {
    const band = cabinetRunBand(cabinet);
    const axis = inferRunAxis(cabinet);
    const side = inferRunSide(cabinet, roomBounds);
    const lineBucket = Math.round(
      getRunLineValue(cabinet, axis) / RUN_ALIGNMENT_TOLERANCE_MM,
    );
    const key = `${band}:${side}:${axis}:${lineBucket}`;
    const group = groups.get(key) ?? [];
    group.push(cabinet);
    groups.set(key, group);
  }

  const runs: CabinetRun[] = [];

  for (const [key, group] of groups) {
    const [band, side, axis] = key.split(":") as [
      CabinetRunBand,
      CabinetRunSide,
      CabinetRunAxis,
    ];
    const sorted = [...group].sort(
      (a, b) => getRunPrimaryValue(a, axis) - getRunPrimaryValue(b, axis),
    );

    let current: CabinetInstance[] = [];
    for (const cabinet of sorted) {
      const previous = current[current.length - 1];
      if (
        !previous ||
        cabinetsAreAdjacent(previous, cabinet, axis, RUN_GAP_TOLERANCE_MM)
      ) {
        current.push(cabinet);
      } else {
        if (current.length > 0) {
          runs.push({
            id: `run-${runs.length + 1}`,
            side,
            axis,
            band,
            cabinetIds: current.map((item) => item.id),
            cornerTransition: runTouchesRoomCorner(
              current,
              side,
              axis,
              roomBounds,
            ),
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
        band,
        cabinetIds: current.map((item) => item.id),
        cornerTransition: runTouchesRoomCorner(current, side, axis, roomBounds),
      });
    }
  }

  markCornerTransitions(runs, cabinets);
  return runs;
}
