import type { InteriorProject } from "../../interiorProject";
import { persistCabinetFinishOnObject } from "../cabinetFinish";
import { setCabinetInlineDimensions } from "../cabinetRunInlineDims";
import { GOLDEN_RUN_OBJECT_IDS, GOLDEN_RUN_REVISED_FINISH_ID, GOLDEN_RUN_REVISED_WIDTH_MM } from "./types";

/** Apply the locked Golden Run width revision to the first base cabinet. */
export function reviseGoldenRunCabinetWidth(
  project: InteriorProject,
  widthMm = GOLDEN_RUN_REVISED_WIDTH_MM,
  objectId = GOLDEN_RUN_OBJECT_IDS.baseA,
): InteriorProject {
  const object = project.objects.find((item) => item.id === objectId);
  if (!object) throw new Error(`Golden run is missing ${objectId}.`);
  // Match the inspector W mm path (resize + run reflow + filler/identity preservation).
  return setCabinetInlineDimensions(project, objectId, { widthMm });
}

/** Apply the locked Golden Run finish revision to the first base cabinet. */
export function reviseGoldenRunCabinetFinish(
  project: InteriorProject,
  finishId = GOLDEN_RUN_REVISED_FINISH_ID,
  objectId = GOLDEN_RUN_OBJECT_IDS.baseA,
): InteriorProject {
  const object = project.objects.find((item) => item.id === objectId);
  if (!object) throw new Error(`Golden run is missing ${objectId}.`);
  return {
    ...project,
    objects: project.objects.map((item) =>
      item.id === objectId ? persistCabinetFinishOnObject(item, finishId) : item,
    ),
  };
}
