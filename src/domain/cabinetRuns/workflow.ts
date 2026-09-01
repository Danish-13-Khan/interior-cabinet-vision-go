import type { CabinetProject, RoomBounds } from "../cabinetDimensions";
import { createCountertopsForRuns } from "./countertops";
import { detectCabinetRuns } from "./detect";
import { createRunFillers } from "./fillers";
import type { CabinetPlanningWorkflow } from "./types";

export function createCabinetPlanningWorkflow(
  project: CabinetProject,
  roomBounds: RoomBounds,
): CabinetPlanningWorkflow {
  const runs = detectCabinetRuns(project.cabinets, roomBounds);

  return {
    runs,
    fillers: runs.flatMap((run) => createRunFillers(run, project, roomBounds)),
    countertops: createCountertopsForRuns(runs, project),
  };
}

export {
  createRunAlignedPlacements,
  createAllRunAlignedPlacements,
} from "./align";
export { detectCabinetRuns } from "./detect";
export { createRunFillers } from "./fillers";
export { countertopSegmentId, createCountertopsForRuns } from "./countertops";
export { snapPlacementIntoRuns } from "./snapToRun";
