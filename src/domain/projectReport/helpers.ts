import type { CabinetProject, RoomBounds } from "../cabinetDimensions";
import type { CabinetPlanningWorkflow } from "../cabinetLibrary";
import type { RoomConfig } from "../roomModel";

export function roomBoundsFromConfig(room: RoomConfig): RoomBounds {
  return {
    widthMm: room.dimensions.widthMm,
    depthMm: room.dimensions.depthMm,
    heightMm: room.dimensions.heightMm,
  };
}

export function formatRunLabel(run: CabinetPlanningWorkflow["runs"][number], index: number) {
  const sideLabel =
    run.side === "back-wall"
      ? "Back wall"
      : run.side === "left-wall"
        ? "Left wall"
        : run.side === "right-wall"
          ? "Right wall"
          : "Free run";
  return `Run ${index + 1} · ${sideLabel}`;
}

export function estimateRunLengthMm(
  run: CabinetPlanningWorkflow["runs"][number],
  project: CabinetProject,
): number {
  const cabinets = run.cabinetIds
    .map((id) => project.cabinets.find((cabinet) => cabinet.id === id))
    .filter((cabinet): cabinet is NonNullable<typeof cabinet> => Boolean(cabinet));

  if (cabinets.length === 0) return 0;

  return cabinets.reduce((sum, cabinet) => {
    const dim =
      run.axis === "x"
        ? cabinet.config.dimensions.width
        : cabinet.config.dimensions.depth;
    return sum + dim;
  }, 0);
}
