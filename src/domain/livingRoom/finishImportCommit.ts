import type { InteriorProject } from "../interiorProject";
import type { FinishImportDraft } from "./finishImportDraft";
import { addImportedFinish } from "./importedFinish";
import { paintLivingRoomSurface, setLivingRoomWallMaterial } from "./materialLayerCommands";
import { applyMaterialToSelection } from "./paintSelection";

export type ImportFinishApplyTarget = {
  wallId?: string;
  floor?: boolean;
  ceiling?: boolean;
  selection?: { objectIds: readonly string[]; slotName?: string };
};

/** Commit a staged finish draft and optionally paint floor / wall / selection. */
export function commitFinishImportDraft(
  project: InteriorProject,
  draft: Pick<FinishImportDraft, "fileName" | "dataUrl" | "uvScaleMm" | "uvRotationDeg" | "uvOffsetU" | "uvOffsetV">,
  apply?: ImportFinishApplyTarget,
): InteriorProject {
  const added = addImportedFinish(project, {
    name: draft.fileName,
    dataUrl: draft.dataUrl,
    uvScaleMm: draft.uvScaleMm,
    uvRotationDeg: draft.uvRotationDeg,
    uvOffsetU: draft.uvOffsetU,
    uvOffsetV: draft.uvOffsetV,
  });
  let next = added.project;
  if (apply?.wallId) next = setLivingRoomWallMaterial(next, apply.wallId, added.materialId);
  if (apply?.floor) next = paintLivingRoomSurface(next, { kind: "floor" }, added.materialId);
  if (apply?.ceiling) next = paintLivingRoomSurface(next, { kind: "ceiling" }, added.materialId);
  if (apply?.selection?.objectIds.length) {
    next = applyMaterialToSelection(
      next,
      apply.selection.objectIds,
      added.materialId,
      apply.selection.slotName,
    );
  }
  return next;
}
