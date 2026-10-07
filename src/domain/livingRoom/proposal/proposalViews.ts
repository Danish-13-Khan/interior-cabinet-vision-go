import type { InteriorProject } from "../../interiorProject";
import { resolvePackageCameraViews } from "../packageCameraBookmarks";
import { proposalViewSelection } from "./proposalViewSelection";
import type { ProposalNamedView } from "./types";

export function listProposalNamedViews(document: InteriorProject): ProposalNamedView[] {
  const selected = new Set(proposalViewSelection(document).selectedIds);
  const available = resolvePackageCameraViews(
    document.renderSettings.packageCameraBookmarks,
    document.cameras,
  );
  return available.map((view) => ({
    cameraId: view.cameraId,
    viewName: view.viewName,
    selected: selected.has(view.cameraId),
  }));
}

export function selectedProposalViews(document: InteriorProject): ProposalNamedView[] {
  return listProposalNamedViews(document).filter((view) => view.selected);
}

/**
 * The selection after ticking or unticking one view in Present. Starts from
 * what the proposal prints today, so an implicit "every bookmark" selection
 * becomes explicit minus that one view, never a re-selection of dropped views.
 */
export function toggleProposalView(document: InteriorProject, cameraId: string): string[] {
  const { selectedIds } = proposalViewSelection(document);
  return selectedIds.includes(cameraId)
    ? selectedIds.filter((id) => id !== cameraId)
    : [...selectedIds, cameraId];
}
