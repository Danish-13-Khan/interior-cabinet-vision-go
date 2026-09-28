import { publicAssetUrl } from "../../utils/publicAssetUrl";
import { LIVING_ROOM_CATALOG, type LivingRoomCatalogItem } from "./catalog";
import type { CameraPoseMm } from "./cameraScreenBounds";
import type { AabbMm } from "./sceneNodeBounds";

/** Rendered by `npm run catalog:render` from the product renderer. */
export const LIVING_ROOM_THUMBNAIL_DIR = "catalog/items";
export const LIVING_ROOM_THUMBNAIL_SIZE = { widthPx: 480, heightPx: 330 } as const;
export const LIVING_ROOM_THUMBNAIL_FOV = 30;

export function livingRoomThumbnailItems(): readonly LivingRoomCatalogItem[] {
  return LIVING_ROOM_CATALOG;
}

export function livingRoomThumbnailFile(itemId: string): string {
  return `${LIVING_ROOM_THUMBNAIL_DIR}/${itemId.replace(/[^a-z0-9-]+/gi, "-")}.png`;
}

export function livingRoomThumbnailUrl(itemId: string): string | null {
  const known = livingRoomThumbnailItems().some((item) => item.id === itemId);
  return known ? publicAssetUrl(livingRoomThumbnailFile(itemId)) : null;
}

/**
 * Three-quarter front view (front faces +z) that fits the object box with a
 * margin. Direction: 35° to the right, 18° above the box centre.
 */
export function livingRoomThumbnailPose(
  box: AabbMm,
  aspect: number = LIVING_ROOM_THUMBNAIL_SIZE.widthPx / LIVING_ROOM_THUMBNAIL_SIZE.heightPx,
  fieldOfViewDegrees: number = LIVING_ROOM_THUMBNAIL_FOV,
  margin = 1.18,
): CameraPoseMm {
  const target = {
    x: (box.min.x + box.max.x) / 2,
    y: (box.min.y + box.max.y) / 2,
    z: (box.min.z + box.max.z) / 2,
  };
  const size = {
    x: box.max.x - box.min.x,
    y: box.max.y - box.min.y,
    z: box.max.z - box.min.z,
  };
  const radius = Math.hypot(size.x, size.y, size.z) / 2;
  const vHalf = (fieldOfViewDegrees * Math.PI) / 360;
  const hHalf = Math.atan(Math.tan(vHalf) * aspect);
  const distance = (radius * margin) / Math.sin(Math.min(vHalf, hHalf));
  const yaw = (35 * Math.PI) / 180;
  const pitch = (18 * Math.PI) / 180;
  return {
    target,
    fieldOfViewDegrees,
    position: {
      x: target.x + distance * Math.cos(pitch) * Math.sin(yaw),
      y: target.y + distance * Math.sin(pitch),
      z: target.z + distance * Math.cos(pitch) * Math.cos(yaw),
    },
  };
}
