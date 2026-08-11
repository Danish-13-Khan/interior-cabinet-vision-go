import { useEffect, useMemo, useState } from "react";
import type { CabinetProject } from "../domain/cabinetDimensions";
import {
  cabinetProjectFromInteriorProject,
  type InteriorProject,
  type Point3Mm,
  type RenderSettings,
  type Size3Mm,
} from "../domain/interiorProject";
import {
  addLivingRoomObject,
  alignLivingRoomObjects,
  applyLivingRoomLightingRecipe,
  applyLivingRoomStyle,
  createLivingRoomObject,
  createLivingRoomStarterProject,
  deleteLivingRoomObjects,
  duplicateLivingRoomObject,
  getActiveLivingRoomStyleId,
  getLivingRoomStylePreset,
  inspectLivingRoomPlan,
  moveLivingRoomObject,
  resizeLivingRoom,
  resizeLivingRoomObject,
  rotateLivingRoomObject,
  type LivingRoomAlignMode,
  type LivingRoomCatalogId,
  type LivingRoomLightingRecipeId,
  type LivingRoomStyleId,
} from "../domain/livingRoom";
import type { RoomConfig } from "../domain/roomModel";
import type { CommitProjectChange, CommitSnapshot } from "./projectCommit";

type UseLivingRoomPlanEditorArgs = {
  project: CabinetProject;
  room: RoomConfig;
  commitProjectChange: CommitProjectChange;
  commitSnapshot: CommitSnapshot;
};

function uniqueObjectId(category: string) {
  const suffix = globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `living-object-${category}-${suffix}`;
}

function currentLivingRoomDocument(project: CabinetProject) {
  const document = project.interiorDocument;
  return document?.rooms.some((room) => room.roomType === "living-room")
    ? document
    : null;
}

export function useLivingRoomPlanEditor({
  project,
  room,
  commitProjectChange,
  commitSnapshot,
}: UseLivingRoomPlanEditorArgs) {
  const document = currentLivingRoomDocument(project);
  const [selectedObjectIds, setSelectedObjectIds] = useState<string[]>([]);
  const [projectHomeOpen, setProjectHomeOpen] = useState(() => !document);

  useEffect(() => {
    const validIds = new Set(document?.objects.map((object) => object.id) ?? []);
    setSelectedObjectIds((current) => current.filter((id) => validIds.has(id)));
  }, [document]);

  useEffect(() => {
    if (!document) setProjectHomeOpen(true);
  }, [document]);

  const selectedObjects = useMemo(
    () =>
      document?.objects.filter((object) => selectedObjectIds.includes(object.id)) ?? [],
    [document, selectedObjectIds],
  );
  const issues = useMemo(
    () => (document ? inspectLivingRoomPlan(document) : []),
    [document],
  );

  function createStarter(options: {
    projectName?: string;
    styleId?: LivingRoomStyleId;
  } = {}) {
    const base = createLivingRoomStarterProject({
      projectId: `living-room-${Date.now()}`,
      projectName: options.projectName,
      now: new Date().toISOString(),
    });
    const starter = options.styleId && options.styleId !== "warm-contemporary"
      ? applyLivingRoomStyle(base, options.styleId)
      : base;
    const compatible = cabinetProjectFromInteriorProject(starter);
    commitSnapshot(
      {
        project: compatible.project,
        room: compatible.room,
        selectedCabinetIds: [],
        activeCabinetId: null,
        selectedPanelName: null,
      },
      "Created the Living Room Starter plan.",
    );
    setSelectedObjectIds([starter.objects[0]!.id]);
    setProjectHomeOpen(false);
  }

  function restoreDocument(nextDocument: InteriorProject) {
    const compatible = cabinetProjectFromInteriorProject(nextDocument);
    commitSnapshot(
      {
        project: compatible.project,
        room: compatible.room,
        selectedCabinetIds: [],
        activeCabinetId: null,
        selectedPanelName: null,
      },
      `Opened ${nextDocument.name}.`,
    );
    setSelectedObjectIds(nextDocument.objects[0]?.id ? [nextDocument.objects[0].id] : []);
    setProjectHomeOpen(false);
  }

  function commitDocument(
    update: (current: InteriorProject) => InteriorProject,
    status: string,
  ) {
    commitProjectChange((currentProject) => {
      const current = currentLivingRoomDocument(currentProject);
      if (!current) return null;
      const next = {
        ...update(current),
        updatedAt: new Date().toISOString(),
      };
      const compatible = cabinetProjectFromInteriorProject(next);
      return {
        project: compatible.project,
        room: compatible.room,
        selectedCabinetIds: [],
        activeCabinetId: null,
        selectedPanelName: null,
      };
    }, status);
  }

  function selectObject(objectId: string | null, additive = false) {
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

  function moveObject(objectId: string, position: Point3Mm) {
    commitDocument(
      (current) => moveLivingRoomObject(current, objectId, position),
      "Moved living-room object.",
    );
  }

  function resizeObject(objectId: string, dimensions: Size3Mm) {
    commitDocument(
      (current) => resizeLivingRoomObject(current, objectId, dimensions),
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

  function setObjectRotation(objectId: string, rotationY: number) {
    commitDocument(
      (current) => rotateLivingRoomObject(current, objectId, rotationY),
      "Changed object rotation.",
    );
  }

  function addCatalogObject(catalogItemId: LivingRoomCatalogId) {
    if (!document) return;
    const item = createLivingRoomObject(catalogItemId, {
      id: uniqueObjectId(catalogItemId.split(":").at(-1) ?? "item"),
      roomId: document.activeRoomId,
      position: {
        x: (document.objects.length % 4) * 150 - 225,
        y: 0,
        z: (document.objects.length % 3) * 150 - 150,
      },
    });
    commitDocument(
      (current) => addLivingRoomObject(current, item),
      `Added ${item.name}.`,
    );
    setSelectedObjectIds([item.id]);
  }

  function duplicateSelection() {
    const sourceId = selectedObjectIds[0];
    if (!sourceId) return;
    const duplicateId = uniqueObjectId("copy");
    commitDocument(
      (current) => duplicateLivingRoomObject(current, sourceId, duplicateId),
      "Duplicated living-room object.",
    );
    setSelectedObjectIds([duplicateId]);
  }

  function deleteSelection() {
    if (selectedObjectIds.length === 0) return;
    const count = selectedObjectIds.length;
    commitDocument(
      (current) => deleteLivingRoomObjects(current, selectedObjectIds),
      `Deleted ${count} object${count === 1 ? "" : "s"}.`,
    );
    setSelectedObjectIds([]);
  }

  function alignSelection(mode: LivingRoomAlignMode) {
    if (selectedObjectIds.length < 2) return;
    commitDocument(
      (current) => alignLivingRoomObjects(current, selectedObjectIds, mode),
      "Aligned living-room selection.",
    );
  }

  function nudgeSelection(dx: number, dz: number) {
    if (selectedObjectIds.length === 0) return;
    commitDocument((current) =>
      selectedObjectIds.reduce((next, objectId) => {
        const object = next.objects.find((item) => item.id === objectId);
        return object
          ? moveLivingRoomObject(next, objectId, {
              ...object.position,
              x: object.position.x + dx,
              z: object.position.z + dz,
            })
          : next;
      }, current), "Nudged living-room selection.");
  }

  function setRoomDimensions(dimensions: Size3Mm) {
    if (!document) return;
    commitDocument(
      (current) => resizeLivingRoom(current, current.activeRoomId, dimensions),
      "Updated living-room dimensions.",
    );
  }

  function setStyle(styleId: LivingRoomStyleId) {
    if (!document || getActiveLivingRoomStyleId(document) === styleId) return;
    commitDocument(
      (current) => applyLivingRoomStyle(current, styleId),
      `Applied ${getLivingRoomStylePreset(styleId).name} interior style.`,
    );
  }

  function setRenderSettings(patch: Partial<RenderSettings>) {
    if (!document) return;
    const changed = Object.entries(patch).some(
      ([key, value]) => document.renderSettings[key as keyof RenderSettings] !== value,
    );
    if (!changed) return;
    commitDocument(
      (current) => ({
        ...current,
        renderSettings: { ...current.renderSettings, ...patch },
      }),
      "Updated Render Studio settings.",
    );
  }

  function setLightingRecipe(recipeId: LivingRoomLightingRecipeId) {
    if (!document || document.renderSettings.lightingRecipeId === recipeId) return;
    commitDocument(
      (current) => applyLivingRoomLightingRecipe(current, recipeId),
      `Applied ${recipeId.split("-").join(" ")} lighting.`,
    );
  }

  return {
    livingRoomDocument: document,
    selectedInteriorObjectIds: selectedObjectIds,
    selectedInteriorObjects: selectedObjects,
    livingRoomIssues: issues,
    livingRoomProjectHomeOpen: projectHomeOpen,
    createLivingRoomStarter: createStarter,
    restoreLivingRoomDocument: restoreDocument,
    openLivingRoomProjectHome: () => setProjectHomeOpen(true),
    closeLivingRoomProjectHome: () => setProjectHomeOpen(false),
    selectInteriorObject: selectObject,
    moveInteriorObject: moveObject,
    resizeInteriorObject: resizeObject,
    rotateInteriorSelection: rotateSelection,
    setInteriorObjectRotation: setObjectRotation,
    addLivingRoomCatalogObject: addCatalogObject,
    duplicateInteriorSelection: duplicateSelection,
    deleteInteriorSelection: deleteSelection,
    alignInteriorSelection: alignSelection,
    nudgeInteriorSelection: nudgeSelection,
    setLivingRoomDimensions: setRoomDimensions,
    setLivingRoomStyle: setStyle,
    setLivingRoomRenderSettings: setRenderSettings,
    setLivingRoomLightingRecipe: setLightingRecipe,
    currentCompatibilityRoom: room,
  };
}
