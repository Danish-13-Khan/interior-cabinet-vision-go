import {
  type CabinetInstance,
  type CabinetProject,
  type RoomBounds,
} from "../cabinetDimensions";
import { getRunExtent, orderedRunCabinets } from "./geometry";
import {
  FILLER_MAX_MM,
  FILLER_MIN_MM,
  type CabinetRun,
  type RunFiller,
} from "./types";

/** Shared CAD/Interiors rule: only manufacture a standard 40–150 mm filler. */
export function fillerWidthForGap(gapMm: number): number | null {
  return gapMm >= FILLER_MIN_MM ? Math.min(gapMm, FILLER_MAX_MM) : null;
}

function makeFiller(options: {
  id: string;
  run: CabinetRun;
  side: RunFiller["side"];
  widthMm: number;
  centerPrimary: number;
  reference: CabinetInstance;
}): RunFiller {
  const { id, run, side, widthMm, centerPrimary, reference } = options;
  const fillerHeight = reference.config.dimensions.height;
  const fillerDepth = reference.config.dimensions.depth;
  return {
    id,
    runId: run.id,
    side,
    widthMm,
    position: {
      x: run.axis === "x" ? centerPrimary : reference.placement.x,
      y: reference.placement.y,
      z: run.axis === "z" ? centerPrimary : reference.placement.z,
    },
    size: {
      width:
        run.axis === "x"
          ? widthMm
          : reference.config.dimensions.boardThickness,
      height: fillerHeight,
      depth: run.axis === "x" ? fillerDepth : widthMm,
    },
  };
}

function wallEndLimits(run: CabinetRun, roomBounds: RoomBounds) {
  if (run.side === "free") return null;
  if (run.axis === "x") {
    return {
      start: -roomBounds.widthMm / 2,
      end: roomBounds.widthMm / 2,
    };
  }
  return {
    start: -roomBounds.depthMm / 2,
    end: roomBounds.depthMm / 2,
  };
}

export function createRunFillers(
  run: CabinetRun,
  project: CabinetProject,
  roomBounds?: RoomBounds,
): RunFiller[] {
  const cabinets = orderedRunCabinets(
    run.cabinetIds,
    project.cabinets,
    run.axis,
  );
  if (cabinets.length === 0) return [];

  const fillers: RunFiller[] = [];

  for (let index = 0; index < cabinets.length - 1; index += 1) {
    const current = cabinets[index]!;
    const next = cabinets[index + 1]!;
    const currentEnd = getRunExtent(current, run.axis).end;
    const nextStart = getRunExtent(next, run.axis).start;
    const gap = nextStart - currentEnd;
    const fillerWidth = fillerWidthForGap(gap);
    if (fillerWidth === null) continue;
    fillers.push(
      makeFiller({
        id: `filler-${run.id}-between-${index + 1}`,
        run,
        side: "between",
        widthMm: fillerWidth,
        centerPrimary: currentEnd + fillerWidth / 2,
        reference: current,
      }),
    );
  }

  if (roomBounds && run.side !== "free") {
    const limits = wallEndLimits(run, roomBounds);
    if (limits) {
      const first = cabinets[0]!;
      const last = cabinets[cabinets.length - 1]!;
      const firstStart = getRunExtent(first, run.axis).start;
      const lastEnd = getRunExtent(last, run.axis).end;
      const startGap = firstStart - limits.start;
      const endGap = limits.end - lastEnd;

      if (startGap >= FILLER_MIN_MM && startGap <= FILLER_MAX_MM) {
        fillers.push(
          makeFiller({
            id: `filler-${run.id}-start`,
            run,
            side: "start",
            widthMm: startGap,
            centerPrimary: limits.start + startGap / 2,
            reference: first,
          }),
        );
      }
      if (endGap >= FILLER_MIN_MM && endGap <= FILLER_MAX_MM) {
        fillers.push(
          makeFiller({
            id: `filler-${run.id}-end`,
            run,
            side: "end",
            widthMm: endGap,
            centerPrimary: limits.end - endGap / 2,
            reference: last,
          }),
        );
      }
    }
  }

  return fillers;
}
