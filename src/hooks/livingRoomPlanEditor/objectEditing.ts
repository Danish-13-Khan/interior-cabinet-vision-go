import type { ResizeAnchors } from "../../domain/interiorProject";
import { resizeInteriorObjectAnchored } from "../../domain/livingRoom/objectResizeAnchor";
import type { Size3Mm } from "../../domain/interiorProject";
import {
  alignLivingRoomObjects,
  dragWallPanel,
  duplicateLivingRoomObject,
  duplicateWallPanel,
  isWallPanelObject,
  moveLivingRoomObject,
  reconcileCabinetRunsAfterObjectRemoval,
  rotateLivingRoomObject,
  setLivingRoomObjectParameters,
  type LivingRoomAlignMode,
} from "../../domain/livingRoom";
import { setLivingRoomObjectRotation } from "../../domain/livingRoom/objectRotation";
import {
  paintLivingRoomObjectSlot as commitObjectPaint,
  paintLivingRoomSelection as commitSelectionPaint,
} from "../livingRoomSketchCommands";
import { uniqueObjectId, type EditorCommandContext } from "./context";

/** Selection and edits to existing objects: resize, rotate, paint, duplicate, delete, align, nudge. */
export function objectEditingCommands(ctx: EditorCommandContext) {
  const { commitDocument, selectedObjectIds, setSelectedObjectIds, setPreDropReason, onStatus } = ctx;

  function selectObject(objectId: string | null, additive = false) {
    setPreDropReason(null);
    if (!objectId) {
      setSelectedObjectIds([]);
      return;
    }
    setSelectedObjectIds((current) => {
      if (!additive) return [objectId];
      return current.includes(objectId)
        ? current.filter((id) => id !== objectId)
        : [...current, objectId];
    });
  }

  function selectObjects(objectIds: string[]) {
    setPreDropReason(null);
    setSelectedObjectIds([...objectIds]);
  }

  function handleObjectDragEnd(info: { committed: boolean; mode: "move" | "resize" }) {
    // Keep a failed-drop reason when a move was attempted (moveObject sets it).
    // Clear when the gesture ended without committing so a stale reason cannot linger.
    if (!info.committed) {
      setPreDropReason(null);
    }
  }

  function resizeObject(objectId: string, dimensions: Size3Mm, anchors?: ResizeAnchors) {
    commitDocument(
      (current) => resizeInteriorObjectAnchored(current, objectId, dimensions, anchors),
      "Resized living-room object.",
    );
  }

  function rotateSelection(deltaDegrees: number) {
    if (selectedObjectIds.length === 0) return;
    commitDocument((current) => {
      return selectedObjectIds.reduce((next, objectId) => {
        const object = next.objects.find((item) => item.id === objectId);
        return object
          ? rotateLivingRoomObject(next, objectId, object.rotation.y + deltaDegrees)
          : next;
      }, current);
    }, `Rotated ${selectedObjectIds.length} object${selectedObjectIds.length === 1 ? "" : "s"}.`);
  }

  function duplicateSelection() {
    const sourceId = selectedObjectIds[0];
    if (!sourceId) return;
    const duplicateId = uniqueObjectId("copy");
    commitDocument(
      (current) => {
        const source = current.objects.find((item) => item.id === sourceId);
        if (source && isWallPanelObject(source)) {
          return duplicateWallPanel(current, sourceId, duplicateId);
        }
        return duplicateLivingRoomObject(current, sourceId, duplicateId);
      },
      "Duplicated living-room object.",
    );
    setSelectedObjectIds([duplicateId]);
  }

  function deleteSelection() {
    if (selectedObjectIds.length === 0) return;
    const count = selectedObjectIds.length;
    commitDocument(
      (current) => reconcileCabinetRunsAfterObjectRemoval(current, selectedObjectIds),
      `Deleted ${count} object${count === 1 ? "" : "s"}.`,
    );
    setSelectedObjectIds([]);
  }

  function nudgeSelection(dx: number, dz: number) {
    if (selectedObjectIds.length === 0) return;
    commitDocument((current) =>
      selectedObjectIds.reduce((next, objectId) => {
        const object = next.objects.find((item) => item.id === objectId);
        if (!object) return next;
        if (isWallPanelObject(object)) {
          const dragged = dragWallPanel(next, object, {
            x: object.position.x + dx,
            y: object.position.y,
            z: object.position.z + dz,
          });
          return {
            ...next,
            objects: next.objects.map((item) => (item.id === objectId ? dragged : item)),
          };
        }
        return moveLivingRoomObject(next, objectId, {
          ...object.position,
          x: object.position.x + dx,
          z: object.position.z + dz,
        });
      }, current), "Nudged living-room selection.");
  }

  return {
    selectInteriorObject: selectObject,
    selectInteriorObjects: selectObjects,
    onInteriorObjectDragEnd: handleObjectDragEnd,
    resizeInteriorObject: resizeObject,
    rotateInteriorSelection: rotateSelection,
    setInteriorObjectRotation: (objectId: string, rotationY: number) => {
      commitDocument(
        (current) => setLivingRoomObjectRotation(current, objectId, rotationY),
        "Changed object rotation.",
      );
    },
    setInteriorObjectMaterial: (objectId: string, slotName: string, materialId: string) => {
      commitObjectPaint(commitDocument, objectId, slotName, materialId, onStatus);
    },
    applyMaterialToSelection: (materialId: string, slotName?: string) => {
      if (selectedObjectIds.length === 0) return;
      commitSelectionPaint(commitDocument, selectedObjectIds, materialId, slotName, onStatus);
    },
    setInteriorObjectParameters: (objectId: string | readonly string[], patch: Record<string, string | number | boolean>) => {
      const ids = typeof objectId === "string" ? [objectId] : objectId;
      commitDocument(
        (current) => ids.reduce((next, id) => setLivingRoomObjectParameters(next, id, patch), current),
        "Updated cabinet configuration.",
      );
    },
    duplicateInteriorSelection: duplicateSelection,
    deleteInteriorSelection: deleteSelection,
    alignInteriorSelection: (mode: LivingRoomAlignMode) => {
      if (selectedObjectIds.length < 2) return;
      commitDocument(
        (current) => alignLivingRoomObjects(current, selectedObjectIds, mode),
        "Aligned living-room selection.",
      );
    },
    nudgeInteriorSelection: nudgeSelection,
  };
}
