import {
  clampCabinetPlacement,
  getFootprintDimensions,
  type CabinetInstance,
  type CabinetPlacement,
  type CabinetProject,
  type RoomBounds,
} from "../cabinetDimensions";
import {
  getRunPrimaryValue,
  orderedRunCabinets,
  wallFaceLineValue,
} from "./geometry";
import type { CabinetRun } from "./types";

function wallAlignedPlacement(
  cabinet: CabinetInstance,
  run: CabinetRun,
  roomBounds: RoomBounds,
  primaryCenter: number,
): CabinetPlacement {
  const footprint = getFootprintDimensions(
    cabinet.config.dimensions,
    cabinet.placement.rotation,
  );
  const line = wallFaceLineValue(run.side, footprint.depth, roomBounds);
  const next: CabinetPlacement = {
    ...cabinet.placement,
    attachment:
      run.side === "free"
        ? cabinet.placement.attachment
        : run.side === "back-wall" ||
            run.side === "left-wall" ||
            run.side === "right-wall"
          ? run.side
          : cabinet.placement.attachment,
    x: run.axis === "x" ? primaryCenter : line ?? cabinet.placement.x,
    z: run.axis === "z" ? primaryCenter : line ?? cabinet.placement.z,
    y: run.band === "wall" ? cabinet.placement.y : 0,
  };

  // Keep wall cabinets on wall attachment; base/tall on floor unless already wall-mounted.
  if (run.band === "base" || run.band === "tall") {
    if (run.side === "free") {
      next.attachment = "floor";
    } else if (cabinet.config.type === "wall") {
      next.attachment = run.side;
    } else {
      // Floor cabinets on wall runs stay floor-attached but flush to wall face.
      next.attachment = "floor";
      if (line != null) {
        if (run.axis === "x") next.z = line;
        else next.x = line;
      }
    }
  }

  return next;
}

/** Pack cabinets tightly along a run and flush them to the wall face when applicable. */
export function createRunAlignedPlacements(
  run: CabinetRun,
  project: CabinetProject,
  roomBounds: RoomBounds,
): Record<string, CabinetPlacement> {
  const cabinets = orderedRunCabinets(
    run.cabinetIds,
    project.cabinets,
    run.axis,
  );
  if (cabinets.length === 0) return {};

  const placements: Record<string, CabinetPlacement> = {};
  let cursor = getRunPrimaryValue(cabinets[0]!, run.axis);

  for (const cabinet of cabinets) {
    const footprint = getFootprintDimensions(
      cabinet.config.dimensions,
      cabinet.placement.rotation,
    );
    const span = run.axis === "x" ? footprint.width : footprint.depth;
    const primaryCenter = cursor + span / 2;
    const nextPlacement = wallAlignedPlacement(
      cabinet,
      run,
      roomBounds,
      primaryCenter,
    );

    placements[cabinet.id] = clampCabinetPlacement(
      nextPlacement,
      cabinet.config.dimensions,
      roomBounds,
    );

    cursor += span;
  }

  return placements;
}

/** Align all detected runs to walls and pack them. */
export function createAllRunAlignedPlacements(
  runs: CabinetRun[],
  project: CabinetProject,
  roomBounds: RoomBounds,
): Record<string, CabinetPlacement> {
  const placements: Record<string, CabinetPlacement> = {};
  for (const run of runs) {
    Object.assign(
      placements,
      createRunAlignedPlacements(run, project, roomBounds),
    );
  }
  return placements;
}
