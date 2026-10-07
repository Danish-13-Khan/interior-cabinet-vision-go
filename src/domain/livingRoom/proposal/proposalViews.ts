import type { InteriorProject } from "../../interiorProject";
import { resolvePackageCameraViews } from "../packageCameraBookmarks";
import { PROPOSAL_VIEW_SELECTION_LIMIT, proposalViewSelection } from "./proposalViewSelection";
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
 * Why a view's tick box is locked in Present: the last printed view cannot be
 * unticked (an empty stored selection would mean "every bookmark" again), and
 * nothing more can be ticked once the print limit is reached.
 */
export function proposalViewToggleLock(
  document: InteriorProject,
  cameraId: string,
): "last-view" | "limit" | null {
  const { selectedIds } = proposalViewSelection(document);
  if (selectedIds.includes(cameraId)) return selectedIds.length <= 1 ? "last-view" : null;
  return selectedIds.length >= PROPOSAL_VIEW_SELECTION_LIMIT ? "limit" : null;
}

/**
 * The selection after ticking or unticking one view in Present. Starts from
 * what the proposal prints today, so an implicit "every bookmark" selection
 * becomes explicit minus that one view, never a re-selection of dropped views.
 * A locked toggle returns the selection unchanged.
 */
export function toggleProposalView(document: InteriorProject, cameraId: string): string[] {
  const { selectedIds } = proposalViewSelection(document);
  if (proposalViewToggleLock(document, cameraId)) return selectedIds;
  return selectedIds.includes(cameraId)
    ? selectedIds.filter((id) => id !== cameraId)
    : [...selectedIds, cameraId];
}
