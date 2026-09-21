import type { InteriorProject, Point2Mm } from "../interiorProject";
import { selectRoomWalls } from "../interiorProject";
import { cadToPlanPoint } from "./dwgPlanMap";
import { createLivingRoomObject, type LivingRoomCatalogId } from "./catalog";
import { addLivingRoomObject } from "./planCommands";
import { attachToWall } from "./wardrobePlacement";
import type { LivingRoomPlanUnderlay } from "./planUnderlay";
import type { DwgInsertHint } from "./dwgGeometry";

const KNOWN: Record<string, LivingRoomCatalogId> = {
  "BASE-CABINET": "living:base-cabinet-900",
};

export type RecognizedDwgCabinet = {
  catalogItemId: LivingRoomCatalogId;
  name: string;
  layer: string;
  x: number;
  y: number;
  rotation: number;
};

export function recognizedCabinetInserts(inserts: readonly DwgInsertHint[] | undefined): RecognizedDwgCabinet[] {
  return (inserts ?? []).flatMap((insert) => {
    const catalogItemId = KNOWN[insert.name.toUpperCase()];
    return catalogItemId ? [{ ...insert, catalogItemId }] : [];
  });
}

function nextObjectId(project: InteriorProject, prefix: string) {
  const used = new Set(project.objects.map((object) => object.id));
  let index = 1;
  while (used.has(`${prefix}-${index}`)) index += 1;
  return `${prefix}-${index}`;
}

function nearestWallId(project: InteriorProject, roomId: string, point: Point2Mm, minLength: number) {
  let best: { id: string; distance: number } | null = null;
  for (const wall of selectRoomWalls(project, roomId)) {
    const dx = wall.end.x - wall.start.x;
    const dz = wall.end.z - wall.start.z;
    const length = Math.hypot(dx, dz);
    if (length < minLength) continue;
    const t = Math.max(0, Math.min(1, ((point.x - wall.start.x) * dx + (point.z - wall.start.z) * dz) / (length * length)));
    const distance = Math.hypot(point.x - (wall.start.x + dx * t), point.z - (wall.start.z + dz * t));
    if (!best || distance < best.distance) best = { id: wall.id, distance };
  }
  return best?.id ?? null;
}

export function placeRecognizedDwgCabinets(
  project: InteriorProject,
  underlay: LivingRoomPlanUnderlay | null,
): InteriorProject {
  const source = underlay?.dwg;
  const roomId = project.activeRoomId;
  if (!underlay || !source || !roomId) return project;
  let next = project;
  for (const insert of recognizedCabinetInserts(source.preview.inserts)) {
    const plan = cadToPlanPoint(insert, underlay, source.preview.bounds);
    const draft = createLivingRoomObject(insert.catalogItemId, {
      id: nextObjectId(next, "dwg-cabinet"),
      roomId,
      position: { x: plan.x, y: 0, z: plan.z },
      rotationY: insert.rotation * 180 / Math.PI,
    });
    const wallId = nearestWallId(next, roomId, plan, draft.dimensions.widthMm);
    if (!wallId) continue;
    const placed = attachToWall(next, draft, wallId);
    if (!(placed.extensions?.wallAttachment && typeof placed.extensions.wallAttachment === "object")) continue;
    next = addLivingRoomObject(next, placed);
  }
  return next;
}
