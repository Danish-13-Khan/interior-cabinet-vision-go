import type { InteriorProject } from "../../interiorProject";
import { resolvePackageCameraViews } from "../packageCameraBookmarks";
import type { StillProvenance } from "../stillJob/provenance";
import type { ClientPackageView } from "./buildPackageTypes";

export function buildClientPackageViews(
  project: InteriorProject,
  acceptedStills: StillProvenance[] = [],
): ClientPackageView[] {
  const acceptedByCamera = new Map(
    acceptedStills
      .filter((item) => item.acceptanceStatus === "accepted")
      .map((item) => [item.cameraId, item.jobId]),
  );
  return resolvePackageCameraViews(
    project.renderSettings.packageCameraBookmarks,
    project.cameras,
  ).map((view) => {
    const camera = project.cameras.find((item) => item.id === view.cameraId)!;
    return {
      cameraId: view.cameraId,
      viewName: view.viewName,
      sortOrder: view.sortOrder,
      cameraName: view.cameraName,
      fieldOfViewDegrees: view.fieldOfViewDegrees,
      isDefault: view.isDefault,
      positionMm: { ...camera.position },
      targetMm: { ...camera.target },
      acceptedStillJobId: acceptedByCamera.get(view.cameraId) ?? null,
    };
  });
}
