import { useEffect, useMemo, useState } from "react";
import type { CabinetProject } from "../domain/cabinetDimensions";
import {
  cabinetProjectFromInteriorProject,
  createSurfaceZone,
  createWallSegmentResult,
  deleteInteriorRoom,
  deleteSurfaceZone,
  deletePlanWall,
  drawRoomFromPoints,
  mergeCoincidentPlanNodes,
  mergeInteriorRooms,
  explainInteriorRoomMergeBlock,
  movePlanNodeWithOpenings,
  renameInteriorRoom,
  setActiveInteriorRoom,
  setPlanWallHeight,
  setPlanWallThickness,
  setSurfaceZoneMaterial,
  splitPlanWallResult,
  translatePlanWall,
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
  placeCornerCabinet,
  preferredRoomWallCorner,
  reconcileCabinetRunsAfterObjectRemoval,
  reflowCabinetRunsForWalls,
  updateCabinetRunLayout,
  addLivingRoomOpening,
  alignLivingRoomObjects,
  applyLivingRoomLightingRecipe,
  applyLivingRoomStyle,
  type PlannerStarterTemplate,
  ensureDrawnRoomReviewRig,
  createImportedAssetObject,
  createLivingRoomObject,
  createGoldenCabinetRunProject,
  createLivingRoomReleaseDemoProject,
  createPhase1BenchmarkProject,
  type Phase1BenchmarkId,
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
  getLivingRoomPlanUnderlay,
  setLivingRoomPlanUnderlay,
  paintLivingRoomSurface,
  setLivingRoomObjectParameters,
  setLivingRoomWallMaterial,
  placeStructuralColumn,
  setLivingRoomLayerVisibility,
  snapCabinetToWall,
  setCabinetInlineDimensions,
  validateCabinetRunPreDrop,
  completeCabinetRun,
  updateLivingRoomOpening,
  type LivingRoomAlignMode,
  type LivingRoomCatalogId,
  type LivingRoomLightingRecipeId,
  type LivingRoomLayerId,
  type LivingRoomPlanUnderlay,
  type LivingRoomStyleId,
  type ImportedAsset,
} from "../domain/livingRoom";
import { buildLivingRoomStarterDocument } from "../domain/livingRoom/buildStarterDocument";
import {
  lookupBuiltInCatalogItem,
  isObjectBrowserPlaceable,
  placeObjectBrowserItem,
} from "../domain/catalog";
import type { RoomConfig } from "../domain/roomModel";
import type { CommitProjectChange, CommitSnapshot } from "./projectCommit";
import {
  importLivingRoomFinish as commitImportedFinish,
  offsetLivingRoomLoop as commitOffsetLoop,
  offsetLivingRoomWall as commitOffsetWall,
  paintLivingRoomCeiling as commitCeilingPaint,
  paintLivingRoomMaterialColour as commitMaterialColour,
  paintLivingRoomObjectSlot as commitObjectPaint,
  paintLivingRoomSelection as commitSelectionPaint,
  raiseLivingRoomWalls as commitRaisedWalls,
  setLivingRoomFinishUv as commitFinishUv,
  setLivingRoomWallPlan as commitWallPlan,
} from "./livingRoomSketchCommands";

type UseLivingRoomPlanEditorArgs = {
  project: CabinetProject;
  room: RoomConfig;
  commitProjectChange: CommitProjectChange;
  commitSnapshot: CommitSnapshot;
  onStatus?: (status: string) => void;
};

function uniqueObjectId(category: string) {
  const suffix = globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `living-object-${category}-${suffix}`;
}

function currentLivingRoomDocument(project: CabinetProject) {
  return project.interiorDocument ?? null;
}

export function useLivingRoomPlanEditor({
  project,
  room,
  commitProjectChange,
  commitSnapshot,
  onStatus,
}: UseLivingRoomPlanEditorArgs) {
  const document = currentLivingRoomDocument(project);
  const [selectedObjectIds, setSelectedObjectIds] = useState<string[]>([]);
  const [preDropReason, setPreDropReason] = useState<string | null>(null);
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
    template?: PlannerStarterTemplate;
    catalogTemplateId?: string;
  } = {}) {
    const { document: starter, label } = buildLivingRoomStarterDocument({
      ...options,
      projectId: `living-room-${Date.now()}`,
      now: new Date().toISOString(),
    });
    const compatible = cabinetProjectFromInteriorProject(starter);
    commitSnapshot(
      {
        project: compatible.project,
        room: compatible.room,
        selectedCabinetIds: [],
        activeCabinetId: null,
        selectedPanelName: null,
      },
      `Created a ${label}.`,
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
    cabinetIds?: string[],
  ) {
    commitProjectChange((currentProject) => {
      const current = currentLivingRoomDocument(currentProject);
      if (!current) return null;
      const next = {
        ...update(current),
        updatedAt: new Date().toISOString(),
      };
      const compatible = cabinetProjectFromInteriorProject(next);
      const selected = cabinetIds ?? [];
      return {
        project: compatible.project,
        room: compatible.room,
        selectedCabinetIds: selected,
        activeCabinetId: selected[0] ?? null,
        selectedPanelName: null,
      };
    }, status);
  }

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

  function moveObject(objectId: string, position: Point3Mm) {
    if (!document) return;
    const object = document.objects.find((item) => item.id === objectId);
    if (object?.kind === "cabinet") {
      const snapped = snapCabinetToWall(document, object, position);
      const wallAttachment = snapped.extensions?.wallAttachment;
      const wallId = wallAttachment && typeof wallAttachment === "object"
        ? (wallAttachment as { wallId?: string }).wallId
        : undefined;
      const result = validateCabinetRunPreDrop(
        { ...document, objects: document.objects.filter((item) => item.id !== objectId) },
        { object: snapped, wallId },
      );
      if (!result.ok) {
        setPreDropReason(result.message);
        onStatus?.(result.message);
        return;
      }
      setPreDropReason(result.advisory ? result.message : null);
      commitDocument(
        (current) => ({
          ...current,
          objects: current.objects.map((item) => item.id === objectId ? snapped : item),
        }),
        "Moved living-room object.",
      );
      return;
    }
    setPreDropReason(null);
    commitDocument(
      (current) => moveLivingRoomObject(current, objectId, position),
      "Moved living-room object.",
    );
  }

  function previewMoveObject(objectId: string, position: Point3Mm) {
    if (!document) return null;
    const object = document.objects.find((item) => item.id === objectId);
    if (object?.kind !== "cabinet") {
      setPreDropReason(null);
      return null;
    }
    const snapped = snapCabinetToWall(document, object, position);
    const wallAttachment = snapped.extensions?.wallAttachment;
    const wallId = wallAttachment && typeof wallAttachment === "object"
      ? (wallAttachment as { wallId?: string }).wallId
      : undefined;
    const result = validateCabinetRunPreDrop(
      { ...document, objects: document.objects.filter((item) => item.id !== objectId) },
      { object: snapped, wallId },
    );
    if (!result.ok) {
      setPreDropReason(result.message);
    } else {
      setPreDropReason(result.advisory ? result.message : null);
    }
    return { position: snapped.position, rotationY: snapped.rotation.y };
  }

  function handleObjectDragEnd(info: { committed: boolean; mode: "move" | "resize" }) {
    // Keep a failed-drop reason when a move was attempted (moveObject sets it).
    // Clear when the gesture ended without committing so a stale reason cannot linger.
    if (!info.committed) {
      setPreDropReason(null);
    }
  }

  function resizeObject(objectId: string, dimensions: Size3Mm) {
    commitDocument(
      (current) => {
        const object = current.objects.find((item) => item.id === objectId);
        if (object?.kind === "cabinet") {
          return setCabinetInlineDimensions(current, objectId, dimensions);
        }
        return resizeLivingRoomObject(current, objectId, dimensions);
      },
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
    commitObjectPaint(commitDocument, objectId, slotName, materialId, onStatus);
  }

  function applySelectionMaterial(materialId: string, slotName?: string) {
    if (selectedObjectIds.length === 0) return;
    commitSelectionPaint(commitDocument, selectedObjectIds, materialId, slotName, onStatus);
  }

  function setObjectParameters(objectId: string, patch: Record<string, string | number | boolean>) {
    commitDocument(
      (current) => setLivingRoomObjectParameters(current, objectId, patch),
      "Updated cabinet configuration.",
    );
  }

  function setFloorMaterial(materialId: string) {
    if (!document?.materials.some((material) => material.id === materialId)) return;
    commitDocument((current) => paintLivingRoomSurface(current, { kind: "floor" }, materialId), "Painted floor surface.");
  }

  function setWallMaterial(wallId: string, materialId: string | null) {
    if (!document || (materialId !== null && !document.materials.some((material) => material.id === materialId))) return;
    commitDocument((current) => setLivingRoomWallMaterial(current, wallId, materialId), "Painted wall surface.");
  }

  function setLayerVisibility(layer: LivingRoomLayerId, visible: boolean) {
    commitDocument((current) => setLivingRoomLayerVisibility(current, layer, visible), `${visible ? "Showed" : "Hid"} ${layer} layer.`);
  }

  function setPlanUnderlay(underlay: LivingRoomPlanUnderlay | null) {
    const previous = document ? getLivingRoomPlanUnderlay(document) : null;
    const status = !underlay
      ? "Removed plan underlay."
      : !previous
        ? "Imported plan underlay."
        : Boolean(underlay.calibrated) && !previous.calibrated
          ? "Calibrated plan underlay."
          : "Updated plan underlay.";
    commitDocument(
      (current) => setLivingRoomPlanUnderlay(current, underlay),
      status,
    );
  }

  function addCatalogObject(catalogItemId: string, wallId?: string) {
    if (!document) return;
    const browserItem = lookupBuiltInCatalogItem(catalogItemId);
    if (isObjectBrowserPlaceable(browserItem)) {
      const objectId = uniqueObjectId(catalogItemId.split(":").pop() ?? "item");
      commitDocument(
        (current) => placeObjectBrowserItem(current, catalogItemId, {
          objectId,
          roomId: current.activeRoomId,
        }),
        `Added ${browserItem.name}.`,
      );
      setSelectedObjectIds([objectId]);
      return;
    }
    const item = createLivingRoomObject(catalogItemId as LivingRoomCatalogId, {
      id: uniqueObjectId(catalogItemId.split(":").pop() ?? "item"),
      roomId: document.activeRoomId,
      position: {
        x: (document.objects.length % 4) * 150 - 225,
        y: 0,
        z: (document.objects.length % 3) * 150 - 150,
      },
    });
    let placed = wallId ? attachToWall(document, item, wallId) : item;
    if (catalogItemId === "living:corner-wardrobe") {
      const corner = preferredRoomWallCorner(document, document.activeRoomId);
      if (corner) placed = placeCornerCabinet(document, item, corner);
    }
    if (placed.kind === "cabinet") {
      const result = validateCabinetRunPreDrop(document, {
        object: placed,
        wallId: wallId ?? (placed.extensions?.wallAttachment && typeof placed.extensions.wallAttachment === "object"
          ? (placed.extensions.wallAttachment as { wallId?: string }).wallId
          : undefined),
      });
      if (!result.ok) {
        setPreDropReason(result.message);
        onStatus?.(result.message);
        return;
      }
      setPreDropReason(result.advisory ? result.message : null);
    } else {
      setPreDropReason(null);
    }
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
      (current) => reconcileCabinetRunsAfterObjectRemoval(current, selectedObjectIds),
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

  function updateRun(runId: string, options: { gapMm?: number; alignment?: "start" | "center" | "end"; extendToWall?: boolean; fillersEnabled?: boolean }) {
    commitDocument((current) => updateCabinetRunLayout(current, runId, options), "Updated cabinet run.");
  }

  function completeRun(runId: string) {
    let leftover: string | null = null;
    commitDocument((current) => {
      const result = completeCabinetRun(current, runId);
      leftover = result?.leftoverMessage ?? null;
      return result?.project ?? current;
    }, leftover ? `Completed cabinet run — ${leftover}` : "Completed cabinet run.");
    if (leftover) onStatus?.(leftover);
  }

  function setInlineCabinetDims(objectId: string, dims: { widthMm?: number; depthMm?: number; heightMm?: number }) {
    commitDocument(
      (current) => setCabinetInlineDimensions(current, objectId, dims),
      "Updated cabinet dimensions.",
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

  function setActiveRoom(roomId: string) {
    commitDocument((current) => setActiveInteriorRoom(current, roomId), "Switched active room.");
  }

  function renameRoom(roomId: string, name: string) {
    commitDocument((current) => renameInteriorRoom(current, roomId, name), "Renamed room.");
  }

  function deleteRoom(roomId: string) {
    commitDocument((current) => deleteInteriorRoom(current, roomId), "Deleted room.");
  }

  function mergeRooms(targetRoomId: string, absorbedRoomId: string) {
    if (!document) return;
    const block = explainInteriorRoomMergeBlock(document, targetRoomId, absorbedRoomId);
    if (block) {
      onStatus?.(block.message);
      return;
    }
    const preview = mergeInteriorRooms(document, targetRoomId, absorbedRoomId);
    if (preview.rooms.length >= document.rooms.length) {
      onStatus?.(
        "Merge could not rebuild a valid room outline from the shared wall. Check the walls and try again, or delete/redraw one room.",
      );
      return;
    }
    commitDocument(
      (current) => mergeInteriorRooms(current, targetRoomId, absorbedRoomId),
      "Merged rooms.",
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
      raised: true,
    }).project, "Added partition wall.");
  }

  function drawRoom(drawing: RoomDrawingRequest) {
    commitDocument(
      (current) => ensureDrawnRoomReviewRig(current, drawRoomFromPoints(current, drawing, { raised: true })),
      `Created ${drawing.kind} room.`,
    );
  }

  function drawWallSegment(start: Point2Mm, end: Point2Mm, wallKind?: "wall" | "partition") {
    commitDocument((current) => createWallSegmentResult(current, {
      start, end, kind: wallKind, raised: true,
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

  function updateWall(wallId: string, patch: { thicknessMm?: number; heightMm?: number }) {
    if (patch.thicknessMm === undefined && patch.heightMm === undefined) return;
    commitDocument((current) => {
      let next = current;
      if (patch.thicknessMm !== undefined) next = setPlanWallThickness(next, wallId, patch.thicknessMm);
      if (patch.heightMm !== undefined) next = setPlanWallHeight(next, wallId, patch.heightMm);
      return next;
    }, "Updated wall properties.");
  }

  function joinCoincidentNodes() {
    commitDocument((current) => mergeCoincidentPlanNodes(current), "Joined coincident nodes.");
  }

  function moveNode(nodeId: string, position: Point2Mm) {
    commitDocument(
      (current) => {
        const affectedWallIds = current.walls
          .filter((wall) => wall.startNodeId === nodeId || wall.endNodeId === nodeId)
          .map((wall) => wall.id);
        return reflowCabinetRunsForWalls(movePlanNodeWithOpenings(current, nodeId, position), affectedWallIds);
      },
      "Moved wall node.",
    );
  }

  function translateWall(wallId: string, delta: Point2Mm) {
    commitDocument(
      (current) => {
        const wall = current.walls.find((item) => item.id === wallId);
        const affectedWallIds = wall
          ? current.walls
            .filter((item) => item.startNodeId === wall.startNodeId || item.endNodeId === wall.startNodeId
              || item.startNodeId === wall.endNodeId || item.endNodeId === wall.endNodeId)
            .map((item) => item.id)
          : [wallId];
        return reflowCabinetRunsForWalls(translatePlanWall(current, wallId, delta), affectedWallIds);
      },
      "Moved wall.",
    );
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
    openLivingRoomGoldenRun: () => restoreDocument(
      createGoldenCabinetRunProject(),
    ),
    openPhase1Benchmark: (benchmarkId: Phase1BenchmarkId) => restoreDocument(
      createPhase1BenchmarkProject(benchmarkId),
    ),
    restoreLivingRoomDocument: restoreDocument,
    openLivingRoomProjectHome: () => setProjectHomeOpen(true),
    closeLivingRoomProjectHome: () => setProjectHomeOpen(false),
    selectInteriorObject: selectObject,
    selectInteriorObjects: selectObjects,
    moveInteriorObject: moveObject,
    previewInteriorObjectMove: previewMoveObject,
    onInteriorObjectDragEnd: handleObjectDragEnd,
    resizeInteriorObject: resizeObject,
    rotateInteriorSelection: rotateSelection,
    setInteriorObjectRotation: setObjectRotation,
    setInteriorObjectMaterial: setObjectMaterial,
    applyMaterialToSelection: applySelectionMaterial,
    setInteriorObjectParameters: setObjectParameters,
    setLivingRoomFloorMaterial: setFloorMaterial,
    setLivingRoomCeilingMaterial: (materialId: string) => commitCeilingPaint(commitDocument, materialId),
    setLivingRoomWallMaterial: setWallMaterial,
    applyMaterialColour: (
      materialId: string,
      color: string,
      rebinds: import("../domain/catalog/finishRebind").FinishUvRebind[],
    ) => commitMaterialColour(commitDocument, materialId, color, rebinds),
    setLivingRoomLayerVisibility: setLayerVisibility,
    setLivingRoomPlanUnderlay: setPlanUnderlay,
    addLivingRoomCatalogObject: addCatalogObject,
    addImportedLivingRoomAsset: addImportedAsset,
    duplicateInteriorSelection: duplicateSelection,
    deleteInteriorSelection: deleteSelection,
    alignInteriorSelection: alignSelection,
    createLivingRoomCabinetRun: createCabinetRun,
    updateLivingRoomCabinetRun: updateRun,
    completeLivingRoomCabinetRun: completeRun,
    setLivingRoomCabinetInlineDims: setInlineCabinetDims,
    livingRoomPreDropReason: preDropReason,
    clearLivingRoomPreDropReason: () => setPreDropReason(null),
    nudgeInteriorSelection: nudgeSelection,
    setLivingRoomDimensions: setRoomDimensions,
    setActiveLivingRoom: setActiveRoom,
    renameLivingRoom: renameRoom,
    deleteLivingRoom: deleteRoom,
    mergeLivingRooms: mergeRooms,
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
    raiseLivingRoomWalls: (wallIds: string[], raised: boolean, heightMm?: number) =>
      commitRaisedWalls(commitDocument, wallIds, raised, heightMm),
    offsetLivingRoomWall: (wallId: string, offsetMm: number) =>
      commitOffsetWall(commitDocument, wallId, offsetMm),
    offsetLivingRoomLoop: (offsetMm: number) => commitOffsetLoop(commitDocument, offsetMm),
    setLivingRoomWallPlan: (wallId: string, patch: import("../domain/interiorProject").WallPlanPatch) =>
      commitWallPlan(commitDocument, wallId, patch),
    importLivingRoomFinish: (file: File, apply?: { wallId?: string; floor?: boolean; ceiling?: boolean }) =>
      commitImportedFinish(commitDocument, file, apply, onStatus),
    setLivingRoomFinishUv: (
      materialId: string,
      patch: { uvScaleMm?: number; uvRotationDeg?: number },
      rebind?: import("../domain/catalog/finishRebind").FinishUvRebind,
    ) =>
      commitFinishUv(commitDocument, materialId, patch, rebind),
    joinLivingRoomCoincidentNodes: joinCoincidentNodes,
    moveLivingRoomNode: moveNode,
    translateLivingRoomWall: translateWall,
    updateLivingRoomOpening: updateOpening,
    deleteLivingRoomOpening: deleteOpening,
    setLivingRoomStyle: setStyle,
    setLivingRoomRenderSettings: setRenderSettings,
    patchLivingRoomDocument: commitDocument,
    setLivingRoomLightingRecipe: setLightingRecipe,
    currentCompatibilityRoom: room,
  };
}
