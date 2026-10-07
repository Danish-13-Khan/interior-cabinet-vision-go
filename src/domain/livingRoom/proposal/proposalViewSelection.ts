import type { InteriorProject } from "../../interiorProject";
import { resolvePackageCameraViews } from "../packageCameraBookmarks";
import { PROPOSAL_EXTENSION, readProposalCommercial } from "./commercialState";

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

/** Stored selection limit; matches `readProposalSurface`. */
export const PROPOSAL_VIEW_SELECTION_LIMIT = 12;

/**
 * Store an explicit selection without touching the rest of the commercial
 * shell (templates write their default views here at apply time).
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
        selectedViewCameraIds: cameraIds.slice(0, PROPOSAL_VIEW_SELECTION_LIMIT),
      },
    },
  };
}
