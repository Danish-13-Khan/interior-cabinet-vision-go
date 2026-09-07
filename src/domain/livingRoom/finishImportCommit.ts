import type { InteriorProject } from "../interiorProject";
import type { FinishImportDraft } from "./finishImportDraft";
import { addImportedFinish } from "./importedFinish";
import { paintLivingRoomSurface, setLivingRoomWallMaterial } from "./materialLayerCommands";
import {
  applyMaterialToSelection,
  finishKindCompatibleWithSelectionSlot,
} from "./paintSelection";

export type ImportFinishApplyTarget = {
  wallId?: string;
  floor?: boolean;
  ceiling?: boolean;
  selection?: { objectIds: readonly string[]; slotName?: string };
};

function assertSelectionCompatible(project: InteriorProject, draft: FinishImportDraft, apply?: ImportFinishApplyTarget) {
  const selection = apply?.selection;
  if (!selection?.objectIds.length || !selection.slotName) return;
  const objects = selection.objectIds
    .map((id) => project.objects.find((object) => object.id === id))
    .filter((object): object is NonNullable<typeof object> => Boolean(object));
  if (objects.length === 0) return;
  const kind = draft.kind ?? "custom";
  if (!finishKindCompatibleWithSelectionSlot(kind, objects, selection.slotName)) {
    throw new Error(
      `That ${kind} finish is not compatible with the selected “${selection.slotName}” slot.`,
    );
  }
}

/** Commit a staged finish draft and optionally paint floor / wall / selection. */
export function commitFinishImportDraft(
  project: InteriorProject,
  draft: FinishImportDraft,
  apply?: ImportFinishApplyTarget,
): InteriorProject {
  assertSelectionCompatible(project, draft, apply);
  const added = addImportedFinish(project, {
    name: draft.fileName,
    dataUrl: draft.dataUrl,
    uvScaleMm: draft.uvScaleMm,
    uvRotationDeg: draft.uvRotationDeg,
    uvOffsetU: draft.uvOffsetU,
    uvOffsetV: draft.uvOffsetV,
    color: draft.color,
    kind: draft.kind,
    roughness: draft.roughness,
    createdBy: draft.createdBy,
    manufacturerId: draft.manufacturerId,
    catalogueFinishId: draft.catalogueFinishId,
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
