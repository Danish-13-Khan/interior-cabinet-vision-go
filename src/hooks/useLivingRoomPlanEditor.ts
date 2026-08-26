import { useEffect, useMemo, useState } from "react";
import type { CabinetProject } from "../domain/cabinetDimensions";
import {
  cabinetProjectFromInteriorProject,
  createSurfaceZone,
  createWallSegmentResult,
  deleteSurfaceZone,
  deletePlanWall,
  drawRoomFromPoints,
  mergeCoincidentPlanNodes,
  setPlanWallThickness,
  setSurfaceZoneMaterial,
  splitPlanWallResult,
  type InteriorProject,
  type Point2Mm,
  type Point3Mm,
  type RenderSettings,
  type RoomDrawingRequest,
  type Size3Mm,
} from "../domain/interiorProject";
import {
  addLivingRoomObject,
  attachToWall,
  arrangeCabinetRun,
  addLivingRoomOpening,
  alignLivingRoomObjects,
  applyLivingRoomLightingRecipe,
  applyLivingRoomStyle,
  createImportedAssetObject,
  createLivingRoomObject,
  createLivingRoomReleaseDemoProject,
  createPhase1BenchmarkProject,
  createLivingRoomStarterProject,
  type Phase1BenchmarkId,
  deleteLivingRoomObjects,
  deleteLivingRoomOpening,
  duplicateLivingRoomObject,
  getActiveLivingRoomStyleId,
  getLivingRoomStylePreset,
  getOpeningCatalogItem,
  createOpeningCatalogInstance,
  inspectLivingRoomPlan,
  moveLivingRoomObject,
  resizeLivingRoom,
  resizeLivingRoomObject,
  rotateLivingRoomObject,
  setLivingRoomPlanUnderlay,
  setAdvancedStudioState,
  paintLivingRoomSurface,
  placeStructuralColumn,
  setLivingRoomLayerVisibility,
  snapCabinetToWall,
  updateLivingRoomOpening,
  type LivingRoomAlignMode,
  type LivingRoomCatalogId,
  type LivingRoomLightingRecipeId,
  type LivingRoomLayerId,
  type LivingRoomPlanUnderlay,
  type AdvancedStudioState,
  type LivingRoomStyleId,
  type ImportedAsset,
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
    template?: "blank-room" | "wardrobe-wall" | "import-plan";
  } = {}) {
    const base = createLivingRoomStarterProject({
      projectId: `living-room-${Date.now()}`,
      projectName: options.projectName,
      now: new Date().toISOString(),
    });
    const styled = options.styleId && options.styleId !== "warm-contemporary"
      ? applyLivingRoomStyle(base, options.styleId)
      : base;
    const starter = options.template === "blank-room" || options.template === "import-plan"
      ? { ...styled, objects: [] }
      : options.template === "wardrobe-wall"
        ? { ...styled, objects: styled.objects.filter((object) => object.kind === "cabinet") }
        : styled;
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
    setSelectedObjectIds(starter.objects[0] ? [starter.objects[0].id] : []);
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
      (current) => {
        const object = current.objects.find((item) => item.id === objectId);
        return object?.kind === "cabinet"
          ? { ...current, objects: current.objects.map((item) => item.id === objectId ? snapCabinetToWall(current, item, position) : item) }
          : moveLivingRoomObject(current, objectId, position);
      },
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

  function setObjectMaterial(objectId: string, slotName: string, materialId: string) {
    if (!document?.materials.some((material) => material.id === materialId)) return;
    commitDocument((current) => paintLivingRoomSurface(current, { kind: "object", objectId, slotName }, materialId), "Painted object surface.");
  }

  function setObjectParameters(objectId: string, patch: Record<string, string | number | boolean>) {
    commitDocument((current) => ({ ...current, objects: current.objects.map((object) => object.id === objectId ? { ...object, parameters: { ...object.parameters, ...patch } } : object) }), "Updated cabinet configuration.");
  }

  function setFloorMaterial(materialId: string) {
    if (!document?.materials.some((material) => material.id === materialId)) return;
    commitDocument((current) => paintLivingRoomSurface(current, { kind: "floor" }, materialId), "Painted floor surface.");
  }

  function setWallMaterial(wallId: string, materialId: string) {
    if (!document?.materials.some((material) => material.id === materialId)) return;
    commitDocument((current) => paintLivingRoomSurface(current, { kind: "wall", wallId }, materialId), "Painted wall surface.");
  }

  function setLayerVisibility(layer: LivingRoomLayerId, visible: boolean) {
    commitDocument((current) => setLivingRoomLayerVisibility(current, layer, visible), `${visible ? "Showed" : "Hid"} ${layer} layer.`);
  }

  function setPlanUnderlay(underlay: LivingRoomPlanUnderlay | null) {
    commitDocument(
      (current) => setLivingRoomPlanUnderlay(current, underlay),
      underlay ? "Imported plan underlay." : "Removed plan underlay.",
    );
  }

  function updateAdvancedStudio(state: AdvancedStudioState) {
    commitDocument(
      (current) => setAdvancedStudioState(current, state),
      "Updated Advanced Studio workspace.",
    );
  }

  function addCatalogObject(catalogItemId: LivingRoomCatalogId, wallId?: string) {
    if (!document) return;
    const item = createLivingRoomObject(catalogItemId, {
      id: uniqueObjectId(catalogItemId.split(":").pop() ?? "item"),
      roomId: document.activeRoomId,
      position: {
        x: (document.objects.length % 4) * 150 - 225,
        y: 0,
        z: (document.objects.length % 3) * 150 - 150,
      },
    });
    const placed = wallId ? attachToWall(document, item, wallId) : item;
    commitDocument(
      (current) => addLivingRoomObject(current, placed),
      `Added ${item.name}.`,
    );
    setSelectedObjectIds([placed.id]);
  }

  function addImportedAsset(asset: ImportedAsset) {
    if (!document) return;
    const placed = createImportedAssetObject(
      asset,
      uniqueObjectId(asset.category || "import"),
      document.activeRoomId,
      { x: (document.objects.length % 4) * 180 - 270, y: 0, z: (document.objects.length % 3) * 180 - 180 },
    );
    commitDocument((current) => addLivingRoomObject(current, placed), `Imported ${asset.name}.`);
    setSelectedObjectIds([placed.id]);
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

  function createCabinetRun(wallId: string) {
    if (selectedObjectIds.length < 2) return;
    commitDocument((current) => arrangeCabinetRun(current, selectedObjectIds, wallId), "Created cabinet run.");
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

  function addOpening(wallId: string, kind: "door" | "window", requestedOffsetMm?: number, catalogItemId?: string) {
    if (!document) return;
    const wall = document.walls.find((item) => item.id === wallId);
    if (!wall) return;
    const length = Math.hypot(wall.end.x - wall.start.x, wall.end.z - wall.start.z);
    const id = `living-opening-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`;
    const catalog = getOpeningCatalogItem(catalogItemId);
    const item = catalog.kind === kind ? catalog : getOpeningCatalogItem(kind === "door" ? "opening:door-single" : "opening:window-fixed");
    commitDocument((current) => addLivingRoomOpening(current, createOpeningCatalogInstance({
      id, roomId: current.activeRoomId, wallId, catalogItemId: item.catalogItemId,
      offsetMm: requestedOffsetMm ?? Math.max(0, Math.round((length - item.defaults.widthMm) / 2)),
    })), `Added ${kind}.`);
  }

  function addPartitionWall() {
    if (!document) return;
    const room = document.rooms.find((item) => item.id === document.activeRoomId);
    if (!room) return;
    commitDocument((current) => createWallSegmentResult(current, {
      start: { x: 0, z: -room.dimensions.depthMm / 4 },
      end: { x: 0, z: room.dimensions.depthMm / 4 },
      kind: "partition",
    }).project, "Added partition wall.");
  }

  function drawRoom(drawing: RoomDrawingRequest) {
    commitDocument((current) => drawRoomFromPoints(current, drawing), `Created ${drawing.kind} room.`);
  }

  function drawWallSegment(start: Point2Mm, end: Point2Mm, wallKind?: "wall" | "partition") {
    commitDocument((current) => createWallSegmentResult(current, {
      start, end, kind: wallKind,
    }).project, wallKind === "partition" ? "Drew partition wall." : "Drew wall segment.");
  }

  function drawSurface(drawing: RoomDrawingRequest, materialId: string) {
    commitDocument((current) => createSurfaceZone(current, {
      points: drawing.points, materialId,
    }), "Created surface zone.");
  }

  function updateSurface(surfaceId: string, materialId: string) {
    commitDocument((current) => setSurfaceZoneMaterial(current, surfaceId, materialId), "Updated surface material.");
  }

  function removeSurface(surfaceId: string) {
    commitDocument((current) => deleteSurfaceZone(current, surfaceId), "Deleted surface zone.");
  }

  function placeColumn(position: Point2Mm) {
    const id = uniqueObjectId("structural-column");
    commitDocument((current) => placeStructuralColumn(current, id, position), "Placed structural column.");
    setSelectedObjectIds([id]);
  }

  function splitWall(wallId: string, offsetMm?: number): string | null {
    let firstWallId: string | null = null;
    commitDocument((current) => {
      const result = splitPlanWallResult(current, wallId, offsetMm);
      firstWallId = result.firstWallId;
      return result.project;
    }, "Split wall.");
    return firstWallId;
  }

  function deleteWall(wallId: string) {
    commitDocument((current) => deletePlanWall(current, wallId), "Deleted wall.");
  }

  function updateWall(wallId: string, patch: { thicknessMm?: number }) {
    if (patch.thicknessMm === undefined) return;
    commitDocument((current) => setPlanWallThickness(current, wallId, patch.thicknessMm!), "Updated wall thickness.");
  }

  function joinCoincidentNodes() {
    commitDocument((current) => mergeCoincidentPlanNodes(current), "Joined coincident nodes.");
  }

  function updateOpening(openingId: string, patch: Parameters<typeof updateLivingRoomOpening>[2]) {
    commitDocument((current) => updateLivingRoomOpening(current, openingId, patch), "Updated opening.");
  }

  function deleteOpening(openingId: string) {
    commitDocument((current) => deleteLivingRoomOpening(current, openingId), "Removed opening.");
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
    openLivingRoomReleaseDemo: () => restoreDocument(
      createLivingRoomReleaseDemoProject(),
    ),
    openPhase1Benchmark: (benchmarkId: Phase1BenchmarkId) => restoreDocument(
      createPhase1BenchmarkProject(benchmarkId),
    ),
    restoreLivingRoomDocument: restoreDocument,
    openLivingRoomProjectHome: () => setProjectHomeOpen(true),
    closeLivingRoomProjectHome: () => setProjectHomeOpen(false),
    selectInteriorObject: selectObject,
    moveInteriorObject: moveObject,
    resizeInteriorObject: resizeObject,
    rotateInteriorSelection: rotateSelection,
    setInteriorObjectRotation: setObjectRotation,
    setInteriorObjectMaterial: setObjectMaterial,
    setInteriorObjectParameters: setObjectParameters,
    setLivingRoomFloorMaterial: setFloorMaterial,
    setLivingRoomWallMaterial: setWallMaterial,
    setLivingRoomLayerVisibility: setLayerVisibility,
    setLivingRoomPlanUnderlay: setPlanUnderlay,
    updateLivingRoomAdvancedStudio: updateAdvancedStudio,
    addLivingRoomCatalogObject: addCatalogObject,
    addImportedLivingRoomAsset: addImportedAsset,
    duplicateInteriorSelection: duplicateSelection,
    deleteInteriorSelection: deleteSelection,
    alignInteriorSelection: alignSelection,
    createLivingRoomCabinetRun: createCabinetRun,
    nudgeInteriorSelection: nudgeSelection,
    setLivingRoomDimensions: setRoomDimensions,
    addLivingRoomOpening: addOpening,
    addLivingRoomPartition: addPartitionWall,
    drawLivingRoomRoom: drawRoom,
    drawLivingRoomWallSegment: drawWallSegment,
    drawLivingRoomSurface: drawSurface,
    updateLivingRoomSurface: updateSurface,
    deleteLivingRoomSurface: removeSurface,
    placeLivingRoomColumn: placeColumn,
    splitLivingRoomWall: splitWall,
    deleteLivingRoomWall: deleteWall,
    updateLivingRoomWall: updateWall,
    joinLivingRoomCoincidentNodes: joinCoincidentNodes,
    updateLivingRoomOpening: updateOpening,
    deleteLivingRoomOpening: deleteOpening,
    setLivingRoomStyle: setStyle,
    setLivingRoomRenderSettings: setRenderSettings,
    setLivingRoomLightingRecipe: setLightingRecipe,
    currentCompatibilityRoom: room,
  };
}
