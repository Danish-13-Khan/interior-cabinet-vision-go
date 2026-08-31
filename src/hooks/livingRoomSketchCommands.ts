import type { InteriorProject, WallPlanPatch } from "../domain/interiorProject";
import {
  applyWallPlanPatch,
  offsetPlanLoop,
  offsetPlanWall,
  setPlanWallsRaised,
} from "../domain/interiorProject";
import {
  addImportedFinish,
  paintLivingRoomSurface,
  readImageAsDataUrl,
  setFinishUv,
  setLivingRoomWallMaterial,
} from "../domain/livingRoom";

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
) {
  void readImageAsDataUrl(file).then((dataUrl) => {
    commitDocument((current) => {
      const added = addImportedFinish(current, { name: file.name, dataUrl });
      let next = added.project;
      if (apply?.wallId) next = setLivingRoomWallMaterial(next, apply.wallId, added.materialId);
      if (apply?.floor) next = paintLivingRoomSurface(next, { kind: "floor" }, added.materialId);
      if (apply?.ceiling) next = paintLivingRoomSurface(next, { kind: "ceiling" }, added.materialId);
      return next;
    }, "Imported finish.");
  }).catch(() => undefined);
}

export function setLivingRoomFinishUv(
  commitDocument: CommitDocument,
  materialId: string,
  patch: { uvScaleMm?: number; uvRotationDeg?: number },
) {
  commitDocument((current) => setFinishUv(current, materialId, patch), "Adjusted finish mapping.");
}
