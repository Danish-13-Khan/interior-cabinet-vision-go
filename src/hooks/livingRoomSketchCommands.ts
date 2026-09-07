import type { InteriorProject, WallPlanPatch } from "../domain/interiorProject";
import {
  applyWallPlanPatch,
  offsetPlanLoop,
  offsetPlanWall,
  setPlanWallsRaised,
} from "../domain/interiorProject";
import { resolveFinishPickToProjectMaterial } from "../domain/catalog";
import {
  applyMaterialColour,
  applyMaterialToSelection,
  commitFinishImportDraft,
  paintLivingRoomSurface,
  readImageAsDataUrl,
  reflowCabinetRunsForWalls,
  reflowPanelsForWalls,
  setFinishUv,
  wallNeighborhoodIds,
  type FinishImportDraft,
  type FinishUvPatch,
  type ImportFinishApplyTarget,
} from "../domain/livingRoom";
import type { FinishUvRebind } from "../domain/catalog/finishRebind";

type CommitDocument = (update: (current: InteriorProject) => InteriorProject, status: string) => void;

export type ImportFinishApply = ImportFinishApplyTarget;

function reflowWallAttachments(project: InteriorProject, wallIds: readonly string[]) {
  return reflowPanelsForWalls(reflowCabinetRunsForWalls(project, wallIds), wallIds);
}

export function raiseLivingRoomWalls(
  commitDocument: CommitDocument,
  wallIds: string[],
  raised: boolean,
  heightMm?: number,
) {
  if (wallIds.length === 0) return;
  commitDocument(
    (current) => setPlanWallsRaised(current, wallIds, raised, heightMm),
    raised ? "Raised walls to 3D." : "Lowered walls to plan.",
  );
}

export function offsetLivingRoomWall(commitDocument: CommitDocument, wallId: string, offsetMm: number) {
  commitDocument((current) => {
    const affected = wallNeighborhoodIds(current, wallId);
    return reflowWallAttachments(offsetPlanWall(current, wallId, offsetMm), affected);
  }, "Offset parallel wall.");
}

export function offsetLivingRoomLoop(commitDocument: CommitDocument, offsetMm: number) {
  commitDocument((current) => {
    const roomId = current.activeRoomId;
    if (!roomId) return current;
    const affected = current.walls.map((wall) => wall.id);
    return reflowWallAttachments(offsetPlanLoop(current, roomId, offsetMm), affected);
  }, "Offset room loop.");
}

export function setLivingRoomWallPlan(commitDocument: CommitDocument, wallId: string, patch: WallPlanPatch) {
  commitDocument((current) => {
    const affected = wallNeighborhoodIds(current, wallId);
    return reflowWallAttachments(applyWallPlanPatch(current, wallId, patch), affected);
  }, "Updated wall plan.");
}

export function paintLivingRoomCeiling(commitDocument: CommitDocument, materialId: string) {
  commitDocument((current) => {
    if (!current.materials.some((material) => material.id === materialId)) return current;
    return paintLivingRoomSurface(current, { kind: "ceiling" }, materialId);
  }, "Painted ceiling.");
}

export function importLivingRoomFinish(
  commitDocument: CommitDocument,
  source: File | FinishImportDraft,
  apply?: ImportFinishApply,
  onStatus?: (status: string) => void,
) {
  if (!(source instanceof File)) {
    try {
      commitDocument((current) => commitFinishImportDraft(current, source, apply), "Imported finish.");
    } catch (error: unknown) {
      onStatus?.(error instanceof Error ? error.message : "Could not import finish.");
    }
    return;
  }
  void readImageAsDataUrl(source).then((dataUrl) => {
    try {
      commitDocument((current) => commitFinishImportDraft(current, {
        fileName: source.name,
        dataUrl,
        uvScaleMm: 1000,
        uvRotationDeg: 0,
        uvOffsetU: 0,
        uvOffsetV: 0,
      }, apply), "Imported finish.");
    } catch (error: unknown) {
      onStatus?.(error instanceof Error ? error.message : "Could not import finish.");
    }
  }).catch((error: unknown) => {
    onStatus?.(error instanceof Error ? error.message : "Could not import finish.");
  });
}

export function paintLivingRoomObjectSlot(
  commitDocument: CommitDocument,
  objectId: string,
  slotName: string,
  materialId: string,
  onStatus?: (status: string) => void,
) {
  try {
    commitDocument((current) => {
      const resolved = resolveFinishPickToProjectMaterial(current, materialId);
      return paintLivingRoomSurface(
        resolved.project,
        { kind: "object", objectId, slotName },
        resolved.materialId,
      );
    }, "Painted object surface.");
  } catch (error: unknown) {
    onStatus?.(error instanceof Error ? error.message : "Could not paint object surface.");
  }
}

export function paintLivingRoomSelection(
  commitDocument: CommitDocument,
  objectIds: readonly string[],
  materialId: string,
  slotName: string | undefined,
  onStatus?: (status: string) => void,
) {
  try {
    commitDocument(
      (current) => applyMaterialToSelection(current, objectIds, materialId, slotName),
      objectIds.length === 1 ? "Painted object surface." : `Painted ${objectIds.length} selected objects.`,
    );
  } catch (error: unknown) {
    onStatus?.(error instanceof Error ? error.message : "Could not paint selected objects.");
  }
}

export function setLivingRoomFinishUv(
  commitDocument: CommitDocument,
  materialId: string,
  patch: FinishUvPatch,
  rebind?: FinishUvRebind,
) {
  commitDocument(
    (current) => setFinishUv(current, materialId, patch, rebind),
    "Adjusted finish mapping.",
  );
}

export function paintLivingRoomMaterialColour(
  commitDocument: CommitDocument,
  materialId: string,
  color: string,
  rebinds: readonly FinishUvRebind[],
) {
  commitDocument(
    (current) => applyMaterialColour(current, { materialId, color, rebinds }),
    "Applied material colour.",
  );
}
