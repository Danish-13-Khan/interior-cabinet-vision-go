import { noteProjectSnapshot } from "../../domain/projectSnapshots/capture";
import {
  addCeilingCutout,
  createSurfaceZone,
  createWallSegmentResult,
  deleteCeilingCutout,
  deleteInteriorRoom,
  deleteSurfaceZone,
  drawRoomFromPoints,
  explainInteriorRoomMergeBlock,
  mergeInteriorRooms,
  renameInteriorRoom,
  setActiveInteriorRoom,
  setSurfaceZoneMaterial,
  type InteriorProject,
  type OpeningKind,
  type Point2Mm,
  type RoomDrawingRequest,
  type Size3Mm,
} from "../../domain/interiorProject";
import { createCutOpening, cutOpeningOffsetMm } from "../../domain/livingRoom/cutOpening";
import {
  addLivingRoomOpening,
  createOpeningCatalogInstance,
  ensureDrawnRoomReviewRig,
  getOpeningCatalogItem,
  panelHostWallIds,
  placeStructuralColumn,
  reflowCabinetRunsForWalls,
  reflowPanelsForWalls,
  resizeLivingRoom,
  roomWallIds,
} from "../../domain/livingRoom";
import { resolveFloorBuild, writeFloorBuild, type FloorBuild } from "../../domain/interiorProject";
import { uniqueObjectId, type EditorCommandContext } from "./context";

/** Rooms, drawing, openings, surface zones, and columns. */
export function roomCommands(ctx: EditorCommandContext) {
  const { document, commitDocument, setSelectedObjectIds, onStatus } = ctx;

  function setRoomDimensions(dimensions: Size3Mm) {
    if (!document) return;
    commitDocument(
      (current) => {
        const next = resizeLivingRoom(current, current.activeRoomId, dimensions);
        const cabinetWallIds = roomWallIds(next, current.activeRoomId);
        const panelWallIds = panelHostWallIds(next, current.activeRoomId);
        return reflowPanelsForWalls(
          reflowCabinetRunsForWalls(next, cabinetWallIds),
          panelWallIds,
        );
      },
      "Updated living-room dimensions.",
    );
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

  function addOpening(wallId: string, kind: OpeningKind, requestedOffsetMm?: number, catalogItemId?: string) {
    if (!document) return;
    const wall = document.walls.find((item) => item.id === wallId);
    if (!wall) return;
    const length = Math.hypot(wall.end.x - wall.start.x, wall.end.z - wall.start.z);
    const id = `living-opening-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`;
    if (kind === "opening") {
      commitDocument((current) => addLivingRoomOpening(current, createCutOpening({
        id, roomId: current.activeRoomId, wallId,
        offsetMm: requestedOffsetMm ?? cutOpeningOffsetMm(length),
        wallHeightMm: wall.heightMm,
      })), "Cut opening.");
      return;
    }
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
    let committed: InteriorProject | null = null;
    commitDocument((current) => {
      const next = ensureDrawnRoomReviewRig(current, drawRoomFromPoints(current, drawing, { raised: true }));
      committed = next;
      return next;
    }, `Created ${drawing.kind} room.`);
    if (drawing.kind === "polygon" && committed) noteProjectSnapshot("room-closed", committed);
  }

  function placeColumn(position: Point2Mm) {
    const id = uniqueObjectId("structural-column");
    commitDocument((current) => placeStructuralColumn(current, id, position), "Placed structural column.");
    setSelectedObjectIds([id]);
  }

  return {
    setLivingRoomDimensions: setRoomDimensions,
    setActiveLivingRoom: (roomId: string) => {
      commitDocument((current) => setActiveInteriorRoom(current, roomId), "Switched active room.");
    },
    renameLivingRoom: (roomId: string, name: string) => {
      commitDocument((current) => renameInteriorRoom(current, roomId, name), "Renamed room.");
    },
    deleteLivingRoom: (roomId: string) => {
      commitDocument((current) => deleteInteriorRoom(current, roomId), "Deleted room.");
    },
    mergeLivingRooms: mergeRooms,
    addLivingRoomOpening: addOpening,
    addLivingRoomPartition: addPartitionWall,
    drawLivingRoomRoom: drawRoom,
    drawLivingRoomWallSegment: (start: Point2Mm, end: Point2Mm, wallKind?: "wall" | "partition") => {
      commitDocument((current) => createWallSegmentResult(current, {
        start, end, kind: wallKind, raised: true,
      }).project, wallKind === "partition" ? "Drew partition wall." : "Drew wall segment.");
    },
    drawLivingRoomSurface: (drawing: RoomDrawingRequest, materialId: string) => {
      commitDocument((current) => createSurfaceZone(current, {
        points: drawing.points, materialId,
      }), "Created surface zone.");
    },
    updateLivingRoomSurface: (surfaceId: string, materialId: string) => {
      commitDocument((current) => setSurfaceZoneMaterial(current, surfaceId, materialId), "Updated surface material.");
    },
    deleteLivingRoomSurface: (surfaceId: string) => {
      commitDocument((current) => deleteSurfaceZone(current, surfaceId), "Deleted surface zone.");
    },
    drawLivingRoomCeilingCutout: (drawing: RoomDrawingRequest) => {
      if (!document) return;
      if (addCeilingCutout(document, drawing.points) === document) {
        onStatus?.("Ceiling cutouts must sit inside the room and clear of other cutouts.");
        return;
      }
      commitDocument((current) => addCeilingCutout(current, drawing.points), "Added ceiling cutout.");
    },
    deleteLivingRoomCeilingCutout: (roomId: string, cutoutId: string) => {
      commitDocument((current) => deleteCeilingCutout(current, roomId, cutoutId), "Deleted ceiling cutout.");
    },
    placeLivingRoomColumn: placeColumn,
    setLivingRoomFloorBuild: (patch: Partial<FloorBuild>) => {
      commitDocument((current) => {
        const room = current.rooms.find((item) => item.id === current.activeRoomId);
        if (!room) return current;
        const next = writeFloorBuild(room, { ...resolveFloorBuild(room), ...patch });
        return { ...current, rooms: current.rooms.map((item) => item.id === room.id ? next : item) };
      }, "Updated floor build.");
    },
  };
}
