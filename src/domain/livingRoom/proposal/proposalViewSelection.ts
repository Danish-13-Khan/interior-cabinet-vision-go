import type { InteriorProject } from "../../interiorProject";
import { resolvePackageCameraViews } from "../packageCameraBookmarks";
import { PROPOSAL_EXTENSION, readProposalCommercial } from "./commercialState";
import { clampViewSelection } from "./proposalSurface";

export { PROPOSAL_VIEW_SELECTION_LIMIT } from "./proposalSurface";

export type ProposalViewSelection = {
  /** Every bookmarked camera that still exists, in bookmark order. */
  availableIds: string[];
  /** The views the proposal prints, in bookmark order. */
  selectedIds: string[];
  /** False when the surface holds no selection and every bookmark prints. */
  explicit: boolean;
};

/**
 * The one place that decides which bookmarked views a proposal prints (D1).
 * An empty stored selection means every bookmark. Present, the quote
 * fingerprint and the PDF all read this, so they cannot disagree.
 */
export function proposalViewSelection(document: InteriorProject): ProposalViewSelection {
  const { surface } = readProposalCommercial(document);
  const availableIds = resolvePackageCameraViews(
    document.renderSettings.packageCameraBookmarks,
    document.cameras,
  ).map((view) => view.cameraId);
  const explicit = surface.selectedViewCameraIds.length > 0;
  const chosen = new Set(surface.selectedViewCameraIds);
  return {
    availableIds,
    selectedIds: explicit ? availableIds.filter((id) => chosen.has(id)) : availableIds,
    explicit,
  };
}

/**
 * Store an explicit selection without touching the rest of the commercial
 * shell. Templates write their default views here at apply time; Present goes
 * through `setProposalSelectedViews`, which also normalises the shell. Both
 * cap the list with `clampViewSelection`, so the two paths cannot drift.
 */
export function withProposalViewSelection(
  document: InteriorProject,
  cameraIds: readonly string[],
): InteriorProject {
  const existing = document.extensions?.[PROPOSAL_EXTENSION];
  const surface = existing && typeof existing === "object" && !Array.isArray(existing)
    ? (existing as Record<string, unknown>)
    : {};
  return {
    ...document,
    extensions: {
      ...document.extensions,
      [PROPOSAL_EXTENSION]: {
        ...surface,
        selectedViewCameraIds: clampViewSelection(cameraIds),
      },
    },
  };
}
