import { clampProjectDrafting, type ProjectDrafting } from "../draftingAnnotations";
import { getDimOffset } from "../draftingEdit/offsets";
import type { DimRenderOptions } from "./dimGraphics";

export function resolveDimOpts(
  drafting: ProjectDrafting | undefined,
  dimId: string,
  activeDraftObjectId?: string | null,
): DimRenderOptions {
  const safe = clampProjectDrafting(drafting);
  const offset = getDimOffset(safe.dimOffsets, dimId);
  return {
    dimId,
    dx: offset.dx,
    dy: offset.dy,
    selected: activeDraftObjectId === dimId,
  };
}
