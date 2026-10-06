import type { InteriorProject } from "../interiorProject";
import { apartmentOverviewAvailable } from "../livingRoom/overviewCameras";
import type { CardCameraPathId } from "./types";

export function cardCapturePathsForProject(project: InteriorProject): CardCameraPathId[] {
  const templateId = String(project.extensions?.apartmentTemplateId ?? "");
  if (templateId.startsWith("template:apartment:")) {
    return apartmentOverviewAvailable(project.rooms.length)
      ? ["hero", "overview", "overview-to-hero", "room-arc"]
      : ["hero", "room-arc"];
  }
  return ["room-arc"];
}
