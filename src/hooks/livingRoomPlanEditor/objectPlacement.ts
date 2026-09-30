import type { Point3Mm } from "../../domain/interiorProject";
import {
  addLivingRoomObject,
  applyPanelAttachmentPose,
  attachToWall,
  createImportedAssetObject,
  createLivingRoomObject,
  defaultPanelAttachment,
  dragWallPanel,
  isWallPanelObject,
  moveLivingRoomObject,
  placeCornerCabinet,
  preferredRoomWallCorner,
  readPanelAttachment,
  snapCabinetToWall,
  validateCabinetRunPreDrop,
  type ImportedAsset,
  type LivingRoomCatalogId,
} from "../../domain/livingRoom";
import { isObjectBrowserPlaceable, lookupBuiltInCatalogItem, placeObjectBrowserItem } from "../../domain/catalog";
import { attachedWallId, uniqueObjectId, type EditorCommandContext } from "./context";

/** Moving and placing objects, including cabinet pre-drop checks and wall panels. */
export function objectPlacementCommands(ctx: EditorCommandContext) {
  const { document, commitDocument, setSelectedObjectIds, setPreDropReason, onStatus } = ctx;

  function moveObject(objectId: string, position: Point3Mm) {
    if (!document) return;
    const object = document.objects.find((item) => item.id === objectId);
    if (object && isWallPanelObject(object)) {
      setPreDropReason(null);
      commitDocument(
        (current) => {
          const live = current.objects.find((item) => item.id === objectId);
          if (!live || !isWallPanelObject(live)) return current;
          const next = dragWallPanel(current, live, position);
          return {
            ...current,
            objects: current.objects.map((item) => (item.id === objectId ? next : item)),
          };
        },
        "Moved wall panel.",
      );
      return;
    }
    if (object?.kind === "cabinet") {
      const snapped = snapCabinetToWall(document, object, position);
      const result = validateCabinetRunPreDrop(
        { ...document, objects: document.objects.filter((item) => item.id !== objectId) },
        { object: snapped, wallId: attachedWallId(snapped.extensions) },
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
    if (object && isWallPanelObject(object)) {
      setPreDropReason(null);
      const dragged = dragWallPanel(document, object, position);
      return { position: dragged.position, rotationY: dragged.rotation.y };
    }
    if (object?.kind !== "cabinet") {
      setPreDropReason(null);
      return null;
    }
    const snapped = snapCabinetToWall(document, object, position);
    const result = validateCabinetRunPreDrop(
      { ...document, objects: document.objects.filter((item) => item.id !== objectId) },
      { object: snapped, wallId: attachedWallId(snapped.extensions) },
    );
    if (!result.ok) {
      setPreDropReason(result.message);
    } else {
      setPreDropReason(result.advisory ? result.message : null);
    }
    return { position: snapped.position, rotationY: snapped.rotation.y };
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
    if (wallId && isWallPanelObject(placed)) {
      const attachment = {
        ...defaultPanelAttachment(document, wallId, placed),
        ...(readPanelAttachment(placed) ?? {}),
      };
      placed = applyPanelAttachmentPose(document, placed, attachment);
      setPreDropReason(null);
    } else if (placed.kind === "cabinet") {
      const result = validateCabinetRunPreDrop(document, {
        object: placed,
        wallId: wallId ?? attachedWallId(placed.extensions),
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

  return {
    moveInteriorObject: moveObject,
    previewInteriorObjectMove: previewMoveObject,
    addLivingRoomCatalogObject: addCatalogObject,
    addImportedLivingRoomAsset: addImportedAsset,
  };
}
