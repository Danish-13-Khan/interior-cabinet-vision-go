import {
  clampCabinetPlacement,
  getFootprintDimensions,
  type CabinetInstance,
  type CabinetPlacement,
  type CabinetProject,
  type RoomBounds,
} from "../cabinetDimensions";
import type { CabinetRun } from "../cabinetLibrary";

function runPrimaryValue(cabinet: CabinetInstance, axis: CabinetRun["axis"]) {
  return axis === "x" ? cabinet.placement.x : cabinet.placement.z;
}

function orderedRunCabinets(run: CabinetRun, project: CabinetProject) {
  return run.cabinetIds
    .map((id) => project.cabinets.find((cabinet) => cabinet.id === id))
    .filter((cabinet): cabinet is CabinetInstance => Boolean(cabinet))
    .sort(
      (a, b) => runPrimaryValue(a, run.axis) - runPrimaryValue(b, run.axis),
    );
}

/** Pack cabinets along a run in the given order (does not re-sort by position). */
export function packRunPlacementsInOrder(
  run: CabinetRun,
  orderedIds: string[],
  project: CabinetProject,
  roomBounds: RoomBounds,
): Record<string, CabinetPlacement> {
  const cabinets = orderedIds
    .map((id) => project.cabinets.find((cabinet) => cabinet.id === id))
    .filter((cabinet): cabinet is CabinetInstance => Boolean(cabinet));

  if (cabinets.length === 0) return {};

  const placements: Record<string, CabinetPlacement> = {};
  let cursor = runPrimaryValue(cabinets[0]!, run.axis);

  for (const cabinet of cabinets) {
    const footprint = getFootprintDimensions(
      cabinet.config.dimensions,
      cabinet.placement.rotation,
    );
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

/**
 * Move a cabinet earlier/later within its run and re-pack placements.
 * Returns null when the move is not possible.
 */
export function reorderCabinetInRun(
  run: CabinetRun,
  project: CabinetProject,
  roomBounds: RoomBounds,
  cabinetId: string,
  direction: -1 | 1,
): CabinetProject | null {
  if (run.id.startsWith("loose-")) return null;

  const ordered = orderedRunCabinets(run, project);
  const index = ordered.findIndex((cabinet) => cabinet.id === cabinetId);
  const swapIndex = index + direction;
  if (index < 0 || swapIndex < 0 || swapIndex >= ordered.length) {
    return null;
  }

  const nextOrder = ordered.map((cabinet) => cabinet.id);
  const tmp = nextOrder[index]!;
  nextOrder[index] = nextOrder[swapIndex]!;
  nextOrder[swapIndex] = tmp;

  const placements = packRunPlacementsInOrder(
    run,
    nextOrder,
    project,
    roomBounds,
  );
  if (Object.keys(placements).length === 0) return null;

  return {
    ...project,
    cabinets: project.cabinets.map((cabinet) =>
      placements[cabinet.id]
        ? { ...cabinet, placement: placements[cabinet.id]! }
        : cabinet,
    ),
  };
}

/** Resolve isolate set: keep only the given cabinet ids visible. */
export function resolveIsolateSet(
  current: string[] | null,
  cabinetIds: string[],
): string[] | null {
  if (cabinetIds.length === 0) return current;
  const next = [...new Set(cabinetIds)];
  if (
    current &&
    current.length === next.length &&
    next.every((id) => current.includes(id))
  ) {
    return null;
  }
  return next;
}
