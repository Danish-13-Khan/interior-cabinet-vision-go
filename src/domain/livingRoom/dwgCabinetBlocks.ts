import type { InteriorProject } from "../interiorProject";
import { cadToPlanPoint } from "./dwgPlanMap";
import { createLivingRoomObject, type LivingRoomCatalogId } from "./catalog";
import { addLivingRoomObject } from "./planCommands";
import { snapCabinetToWall } from "./wardrobePlacement";
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
    const placed = snapCabinetToWall(next, draft, { x: plan.x, y: 0, z: plan.z });
    if (!(placed.extensions?.wallAttachment && typeof placed.extensions.wallAttachment === "object")) continue;
    next = addLivingRoomObject(next, placed);
  }
  return next;
}
