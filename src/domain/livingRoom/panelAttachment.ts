import type { InteriorObjectEntity, InteriorProject, WallEntity } from "../interiorProject";
import { orientWallForRoom, selectRoomWalls } from "../interiorProject";
import { wallLength } from "./wallSegmentPlacement";

/** §2.1 — panel face of host wall (not compass wallSide on room walls). */
export type PanelWallSide = "interior" | "exterior";

export type PanelAttachment = {
  wallId: string;
  alongMm: number;
  floorOffsetMm: number;
  wallSide: PanelWallSide;
  visible: boolean;
};

const PANEL_CATEGORIES = new Set(["wall-panel", "feature-wall"]);

export function isWallPanelObject(object: InteriorObjectEntity): boolean {
  if (PANEL_CATEGORIES.has(object.category)) return true;
  return object.catalogItemId === "living:decorative-panel"
    || object.catalogItemId === "living:feature-wall-fluted";
}

export function readPanelAttachment(object: InteriorObjectEntity): PanelAttachment | null {
  const raw = object.extensions?.wallAttachment;
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const wallId = typeof record.wallId === "string" ? record.wallId : null;
  if (!wallId) return null;
  const wallSide = record.wallSide === "exterior" ? "exterior" : "interior";
  return {
    wallId,
    alongMm: Number(record.alongMm) || 0,
    floorOffsetMm: Number(record.floorOffsetMm) || 0,
    wallSide,
    visible: record.visible !== false,
  };
}

export function writePanelAttachment(
  object: InteriorObjectEntity,
  attachment: PanelAttachment,
): InteriorObjectEntity {
  return {
    ...object,
    extensions: {
      ...object.extensions,
      wallAttachment: {
        wallId: attachment.wallId,
        alongMm: attachment.alongMm,
        floorOffsetMm: attachment.floorOffsetMm,
        wallSide: attachment.wallSide,
        visible: attachment.visible,
      },
    },
  };
}

export function isPanelAttachmentVisible(object: InteriorObjectEntity): boolean {
  const attachment = readPanelAttachment(object);
  if (!attachment) return true;
  return attachment.visible;
}

function clampAlongMm(wall: WallEntity, object: InteriorObjectEntity, alongMm: number) {
  const length = wallLength(wall);
  const half = object.dimensions.widthMm / 2;
  return Math.max(half, Math.min(length - half, alongMm));
}

/** Resolve world pose from §2.1 attachment (source of truth — not baked XYZ alone). */
export function resolvePanelPose(
  project: InteriorProject,
  object: InteriorObjectEntity,
  attachment: PanelAttachment,
): { position: InteriorObjectEntity["position"]; rotationY: number } | null {
  const stored = selectRoomWalls(project, object.roomId).find((wall) => wall.id === attachment.wallId);
  if (!stored) return null;
  const wall = orientWallForRoom(project, object.roomId, stored);
  const length = wallLength(wall);
  if (length < object.dimensions.widthMm) return null;
  const ux = (wall.end.x - wall.start.x) / length;
  const uz = (wall.end.z - wall.start.z) / length;
  let nx = -uz;
  let nz = ux;
  if (attachment.wallSide === "exterior") {
    nx = -nx;
    nz = -nz;
  }
  const along = clampAlongMm(wall, object, attachment.alongMm);
  return {
    position: {
      x: wall.start.x + ux * along + nx * (wall.thicknessMm / 2 + object.dimensions.depthMm / 2),
      y: attachment.floorOffsetMm,
      z: wall.start.z + uz * along + nz * (wall.thicknessMm / 2 + object.dimensions.depthMm / 2),
    },
    rotationY: Math.round((Math.atan2(nx, nz) * 180) / Math.PI) || 0,
  };
}

export function applyPanelAttachmentPose(
  project: InteriorProject,
  object: InteriorObjectEntity,
  attachment: PanelAttachment,
): InteriorObjectEntity {
  const clamped: PanelAttachment = {
    ...attachment,
    alongMm: (() => {
      const wall = selectRoomWalls(project, object.roomId).find((item) => item.id === attachment.wallId);
      return wall ? clampAlongMm(orientWallForRoom(project, object.roomId, wall), object, attachment.alongMm) : attachment.alongMm;
    })(),
  };
  const pose = resolvePanelPose(project, object, clamped);
  const withAttachment = writePanelAttachment(object, clamped);
  if (!pose) return withAttachment;
  return {
    ...withAttachment,
    position: pose.position,
    rotation: { ...withAttachment.rotation, y: pose.rotationY },
  };
}

export function defaultPanelAttachment(
  project: InteriorProject,
  wallId: string,
  object: InteriorObjectEntity,
): PanelAttachment {
  const wall = selectRoomWalls(project, object.roomId).find((item) => item.id === wallId);
  const length = wall ? wallLength(orientWallForRoom(project, object.roomId, wall)) : object.dimensions.widthMm;
  return {
    wallId,
    alongMm: length / 2,
    floorOffsetMm: 0,
    wallSide: "interior",
    visible: true,
  };
}
