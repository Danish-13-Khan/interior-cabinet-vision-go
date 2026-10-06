import { apartmentOverviewAvailable, overviewCameraId } from "../livingRoom/overviewCameras";
import type { InteriorProject } from "../interiorProject";
import type { ShowcaseTourStop } from "./showcaseTour";

export const SHOWCASE_TOUR_OVERVIEW_NAME = "Whole apartment";

/** First tour stop: the whole plan from the default high corner. */
export function showcaseTourOverviewStop(): ShowcaseTourStop {
  return {
    roomId: null,
    roomName: SHOWCASE_TOUR_OVERVIEW_NAME,
    cameraId: overviewCameraId("ne"),
    overview: true,
  };
}

export function showcaseTourPrependsOverview(project: InteriorProject): boolean {
  return apartmentOverviewAvailable(project.rooms.length);
}
