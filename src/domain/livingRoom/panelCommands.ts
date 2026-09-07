import type { InteriorObjectEntity, InteriorProject, Size3Mm } from "../interiorProject";
import { orientWallForRoom, selectRoomWalls } from "../interiorProject";
import { createLivingRoomObject, type LivingRoomCatalogId } from "./catalog";
import {
  applyPanelAttachmentPose,
  defaultPanelAttachment,
  isWallPanelObject,
  readPanelAttachment,
  type PanelAttachment,
  type PanelWallSide,
  writePanelAttachment,
} from "./panelAttachment";
import { wallLength } from "./wallSegmentPlacement";

const DEFAULT_PANEL_CATALOG_ID = "living:decorative-panel" as LivingRoomCatalogId;

function uniquePanelId() {
  const stamp = globalThis.crypto?.randomUUID?.()
    ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `living-object-wall-panel-${stamp}`;
}

/** Add a decorative / feature panel on a structural wall (§2.1). */
export function addWallPanel(
  project: InteriorProject,
  wallId: string,
  options?: {
    catalogItemId?: LivingRoomCatalogId;
    alongMm?: number;
    floorOffsetMm?: number;
    wallSide?: PanelWallSide;
    dimensions?: Partial<Size3Mm>;
  },
): InteriorProject {
  if (!project.walls.some((wall) => wall.id === wallId)) return project;
  const catalogItemId = options?.catalogItemId ?? DEFAULT_PANEL_CATALOG_ID;
  const draft = createLivingRoomObject(catalogItemId, {
    id: uniquePanelId(),
    roomId: project.activeRoomId,
    position: { x: 0, y: 0, z: 0 },
  });
  const sized: InteriorObjectEntity = options?.dimensions
    ? { ...draft, dimensions: { ...draft.dimensions, ...options.dimensions } }
    : draft;
  const attachment: PanelAttachment = {
    ...defaultPanelAttachment(project, wallId, sized),
    ...(options?.alongMm != null ? { alongMm: options.alongMm } : {}),
    ...(options?.floorOffsetMm != null ? { floorOffsetMm: options.floorOffsetMm } : {}),
    ...(options?.wallSide ? { wallSide: options.wallSide } : {}),
  };
  const placed = applyPanelAttachmentPose(project, sized, attachment);
  return { ...project, objects: [...project.objects, placed] };
}

export function updatePanelAttachment(
  project: InteriorProject,
  objectId: string,
  patch: Partial<PanelAttachment>,
): InteriorProject {
  const object = project.objects.find((item) => item.id === objectId);
  if (!object || !isWallPanelObject(object)) return project;
  const current = readPanelAttachment(object) ?? defaultPanelAttachment(project, patch.wallId ?? "", object);
  if (!current.wallId && !patch.wallId) return project;
  const nextAttachment: PanelAttachment = { ...current, ...patch };
  const placed = applyPanelAttachmentPose(project, object, nextAttachment);
  return {
    ...project,
    objects: project.objects.map((item) => (item.id === objectId ? placed : item)),
  };
}

export function setPanelVisible(
  project: InteriorProject,
  objectId: string,
  visible: boolean,
): InteriorProject {
  return updatePanelAttachment(project, objectId, { visible });
}

const MIN_PANEL_WIDTH_MM = 100;
const MIN_PANEL_HEIGHT_MM = 100;
const MIN_PANEL_DEPTH_MM = 6;

function clampPanelDimensions(
  project: InteriorProject,
  object: InteriorObjectEntity,
  dimensions: Size3Mm,
): Size3Mm | null {
  const widthMm = Math.round(dimensions.widthMm);
  const heightMm = Math.round(dimensions.heightMm);
  const depthMm = Math.round(dimensions.depthMm);
  if (
    !Number.isFinite(widthMm) || !Number.isFinite(heightMm) || !Number.isFinite(depthMm)
    || widthMm < MIN_PANEL_WIDTH_MM || heightMm < MIN_PANEL_HEIGHT_MM || depthMm < MIN_PANEL_DEPTH_MM
  ) {
    return null;
  }
  const attachment = readPanelAttachment(object);
  const wall = attachment
    ? selectRoomWalls(project, object.roomId).find((item) => item.id === attachment.wallId)
    : undefined;
  const maxWidth = wall
    ? wallLength(orientWallForRoom(project, object.roomId, wall))
    : widthMm;
  if (maxWidth < MIN_PANEL_WIDTH_MM) return null;
  return {
    widthMm: Math.min(widthMm, Math.floor(maxWidth)),
    heightMm,
    depthMm,
  };
}

export function resizeWallPanel(
  project: InteriorProject,
  objectId: string,
  dimensions: Size3Mm,
): InteriorProject {
  const object = project.objects.find((item) => item.id === objectId);
  if (!object || !isWallPanelObject(object)) return project;
  const nextDims = clampPanelDimensions(project, object, dimensions);
  if (!nextDims) return project;
  const attachment = readPanelAttachment(object);
  const resized = { ...object, dimensions: nextDims };
  if (!attachment) {
    return {
      ...project,
      objects: project.objects.map((item) => (item.id === objectId ? resized : item)),
    };
  }
  const placed = applyPanelAttachmentPose(project, resized, attachment);
  return {
    ...project,
    objects: project.objects.map((item) => (item.id === objectId ? placed : item)),
  };
}

/** Re-resolve panel poses when host walls move/resize — does not mutate wall geometry. */
export function reflowPanelsForWalls(
  project: InteriorProject,
  wallIds: readonly string[],
): InteriorProject {
  if (wallIds.length === 0) return project;
  const affected = new Set(wallIds);
  let changed = false;
  const objects = project.objects.map((object) => {
    if (!isWallPanelObject(object)) return object;
    const attachment = readPanelAttachment(object);
    if (!attachment || !affected.has(attachment.wallId)) return object;
    const next = applyPanelAttachmentPose(project, object, attachment);
    if (
      next.position.x !== object.position.x
      || next.position.y !== object.position.y
      || next.position.z !== object.position.z
      || next.rotation.y !== object.rotation.y
    ) {
      changed = true;
    }
    return next;
  });
  return changed ? { ...project, objects } : project;
}

export function listPanelsOnWall(project: InteriorProject, wallId: string): InteriorObjectEntity[] {
  return project.objects.filter((object) => {
    if (!isWallPanelObject(object)) return false;
    return readPanelAttachment(object)?.wallId === wallId;
  });
}

/** Promote legacy `{ wallId }` feature-wall attachments to full §2.1 fields. */
export function ensurePanelAttachmentFields(
  project: InteriorProject,
  object: InteriorObjectEntity,
): InteriorObjectEntity {
  if (!isWallPanelObject(object)) return object;
  const existing = readPanelAttachment(object);
  if (!existing) return object;
  if (
    typeof (object.extensions?.wallAttachment as { alongMm?: unknown } | undefined)?.alongMm === "number"
    && typeof (object.extensions?.wallAttachment as { floorOffsetMm?: unknown } | undefined)?.floorOffsetMm === "number"
  ) {
    return object;
  }
  const defaults = defaultPanelAttachment(project, existing.wallId, object);
  return writePanelAttachment(object, { ...defaults, ...existing });
}
