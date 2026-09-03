import type { InteriorProject, WallPlanPatch } from "../domain/interiorProject";
import {
  applyWallPlanPatch,
  offsetPlanLoop,
  offsetPlanWall,
  setPlanWallsRaised,
} from "../domain/interiorProject";
import {
  addImportedFinish,
  applyMaterialToSelection,
  paintLivingRoomSurface,
  readImageAsDataUrl,
  setFinishUv,
  setLivingRoomWallMaterial,
} from "../domain/livingRoom";
import type { FinishUvRebind } from "../domain/catalog/finishRebind";

type CommitDocument = (update: (current: InteriorProject) => InteriorProject, status: string) => void;

export type ImportFinishApply = { wallId?: string; floor?: boolean; ceiling?: boolean };

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
  commitDocument((current) => offsetPlanWall(current, wallId, offsetMm), "Offset parallel wall.");
}

export function offsetLivingRoomLoop(commitDocument: CommitDocument, offsetMm: number) {
  commitDocument((current) => {
    const roomId = current.activeRoomId;
    return roomId ? offsetPlanLoop(current, roomId, offsetMm) : current;
  }, "Offset room loop.");
}

export function setLivingRoomWallPlan(commitDocument: CommitDocument, wallId: string, patch: WallPlanPatch) {
  commitDocument((current) => applyWallPlanPatch(current, wallId, patch), "Updated wall plan.");
}

export function paintLivingRoomCeiling(commitDocument: CommitDocument, materialId: string) {
  commitDocument((current) => {
    if (!current.materials.some((material) => material.id === materialId)) return current;
    return paintLivingRoomSurface(current, { kind: "ceiling" }, materialId);
  }, "Painted ceiling.");
}

export function importLivingRoomFinish(
  commitDocument: CommitDocument,
  file: File,
  apply?: ImportFinishApply,
  onStatus?: (status: string) => void,
) {
  void readImageAsDataUrl(file).then((dataUrl) => {
    try {
      commitDocument((current) => {
        const added = addImportedFinish(current, { name: file.name, dataUrl });
        let next = added.project;
        if (apply?.wallId) next = setLivingRoomWallMaterial(next, apply.wallId, added.materialId);
        if (apply?.floor) next = paintLivingRoomSurface(next, { kind: "floor" }, added.materialId);
        if (apply?.ceiling) next = paintLivingRoomSurface(next, { kind: "ceiling" }, added.materialId);
        return next;
      }, "Imported finish.");
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
    commitDocument(
      (current) => paintLivingRoomSurface(current, { kind: "object", objectId, slotName }, materialId),
      "Painted object surface.",
    );
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
  patch: { uvScaleMm?: number; uvRotationDeg?: number },
  rebind?: FinishUvRebind,
) {
  commitDocument(
    (current) => setFinishUv(current, materialId, patch, rebind),
    "Adjusted finish mapping.",
  );
}
