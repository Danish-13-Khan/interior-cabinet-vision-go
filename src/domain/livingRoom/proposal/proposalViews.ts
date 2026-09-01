import type { InteriorProject } from "../../interiorProject";
import { resolvePackageCameraViews } from "../packageCameraBookmarks";
import { readProposalCommercial } from "./commercialState";
import type { ProposalNamedView } from "./types";

export function listProposalNamedViews(document: InteriorProject): ProposalNamedView[] {
  const { surface } = readProposalCommercial(document);
  const available = resolvePackageCameraViews(
    document.renderSettings.packageCameraBookmarks,
    document.cameras,
  );
  const selectedIds = surface.selectedViewCameraIds;
  return available.map((view) => ({
    cameraId: view.cameraId,
    viewName: view.viewName,
    selected: selectedIds.length === 0 || selectedIds.includes(view.cameraId),
  }));
}

export function selectedProposalViews(document: InteriorProject): ProposalNamedView[] {
  return listProposalNamedViews(document).filter((view) => view.selected);
}

export function toggleProposalView(
  selectedIds: string[],
  availableIds: string[],
  cameraId: string,
): string[] {
  const current = selectedIds.length ? selectedIds : availableIds;
  return current.includes(cameraId)
    ? current.filter((id) => id !== cameraId)
    : [...current, cameraId];
}
