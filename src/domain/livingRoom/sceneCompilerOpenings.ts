import type { OpeningEntity, WallEntity } from "../interiorProject";
import { LIVING_ROOM_MATERIAL_IDS } from "./materials";
import { createProceduralRenderBinding } from "./renderAssetBindings";
import { getOpeningCatalogItem } from "./openingCatalog";
import { boxPrimitive } from "./scenePrimitives";
import type { CompiledSceneNode } from "./sceneTypes";

function wallPoint(wall: WallEntity, distanceMm: number) {
  const dx = wall.end.x - wall.start.x;
  const dz = wall.end.z - wall.start.z;
  const length = Math.max(1, Math.hypot(dx, dz));
  return {
    x: wall.start.x + (dx / length) * distanceMm,
    z: wall.start.z + (dz / length) * distanceMm,
  };
}

function resolveOpeningMaterial(
  opening: OpeningEntity,
  slot: string,
  fallback: string,
) {
  const assigned = opening.materialSlots?.[slot];
  return assigned && assigned.length > 0 ? assigned : fallback;
}

export function compileOpeningNode(
  opening: OpeningEntity,
  wall: WallEntity,
): CompiledSceneNode | null {
  if (opening.kind === "opening") return null;
  const catalog = getOpeningCatalogItem(opening.catalogItemId);
  const midpoint = wallPoint(wall, opening.offsetMm + opening.widthMm / 2);
  const rotationY = -Math.atan2(
    wall.end.z - wall.start.z,
    wall.end.x - wall.start.x,
  ) * 180 / Math.PI;
  const leafOrGlass = resolveOpeningMaterial(
    opening,
    opening.kind === "window" ? "glass" : "leaf",
    opening.kind === "window"
      ? LIVING_ROOM_MATERIAL_IDS.clearGlass
      : LIVING_ROOM_MATERIAL_IDS.naturalOak,
  );
  const frame = resolveOpeningMaterial(
    opening,
    "frame",
    opening.kind === "window"
      ? LIVING_ROOM_MATERIAL_IDS.ceilingPaint
      : LIVING_ROOM_MATERIAL_IDS.walnut,
  );
  const hardware = resolveOpeningMaterial(
    opening,
    "hardware",
    LIVING_ROOM_MATERIAL_IDS.charcoalMetal,
  );
  const insetDepth = opening.kind === "window" ? 34 : 42;
  const border = opening.kind === "window" ? 46 : 58;
  const primitives = [boxPrimitive(
    opening.kind,
    {
      width: opening.widthMm - border * 2,
      height: opening.heightMm - border * 2,
      depth: opening.kind === "window" ? 12 : 42,
    },
    { x: 0, y: opening.sillHeightMm + opening.heightMm / 2, z: 0 },
    leafOrGlass,
    { castShadow: opening.kind === "door" },
  )];
  if (opening.kind === "door") {
    const yMid = opening.sillHeightMm + opening.heightMm / 2;
    primitives.push(
      boxPrimitive("frame-left", { width: border, height: opening.heightMm, depth: insetDepth }, { x: -opening.widthMm / 2 + border / 2, y: yMid, z: 0 }, frame),
      boxPrimitive("frame-right", { width: border, height: opening.heightMm, depth: insetDepth }, { x: opening.widthMm / 2 - border / 2, y: yMid, z: 0 }, frame),
      boxPrimitive("frame-top", { width: opening.widthMm, height: border, depth: insetDepth }, { x: 0, y: opening.sillHeightMm + opening.heightMm - border / 2, z: 0 }, frame),
      boxPrimitive("hardware", { width: 28, height: 120, depth: 18 }, { x: opening.widthMm / 2 - border - 40, y: yMid, z: insetDepth / 2 + 10 }, hardware),
    );
  }
  if (opening.kind === "window") {
    const yMid = opening.sillHeightMm + opening.heightMm / 2;
    primitives.push(
      boxPrimitive("frame-top", { width: opening.widthMm, height: border, depth: insetDepth }, { x: 0, y: opening.sillHeightMm + opening.heightMm - border / 2, z: 0 }, frame),
      boxPrimitive("frame-bottom", { width: opening.widthMm, height: border, depth: insetDepth }, { x: 0, y: opening.sillHeightMm + border / 2, z: 0 }, frame),
      boxPrimitive("frame-left", { width: border, height: opening.heightMm - border * 2, depth: insetDepth }, { x: -opening.widthMm / 2 + border / 2, y: yMid, z: 0 }, frame),
      boxPrimitive("frame-right", { width: border, height: opening.heightMm - border * 2, depth: insetDepth }, { x: opening.widthMm / 2 - border / 2, y: yMid, z: 0 }, frame),
    );
    if (catalog.symbol === "fixed-glass") {
      primitives.push(
        boxPrimitive("mullion", { width: 28, height: opening.heightMm - border * 2, depth: insetDepth + 4 }, { x: 0, y: yMid, z: 0 }, frame),
      );
    }
    if (catalog.symbol === "casement") {
      primitives.push(
        boxPrimitive("sash", { width: 22, height: opening.heightMm - border * 2, depth: insetDepth + 6 }, { x: -opening.widthMm / 2 + border + 30, y: yMid, z: 0 }, frame),
        boxPrimitive("hardware", { width: 18, height: 80, depth: 16 }, { x: opening.widthMm / 2 - border - 36, y: yMid, z: insetDepth / 2 + 8 }, hardware),
      );
    }
  }
  const materialSlotMeta = Object.fromEntries(
    Object.entries(opening.materialSlots ?? {}).map(([slot, materialId]) => [
      `material.${slot}`,
      materialId,
    ]),
  );
  return {
    id: `opening-node:${opening.id}`,
    name: catalog.name,
    sourceObjectId: null,
    adapterId: `room-${opening.kind}-v1`,
    positionMm: { x: midpoint.x, y: 0, z: midpoint.z },
    rotationDegrees: { x: 0, y: rotationY, z: 0 },
    primitives,
    placeholder: false,
    metadata: {
      role: "opening",
      openingId: opening.id,
      openingKind: opening.kind,
      catalogItemId: catalog.catalogItemId,
      wallSide: String(wall.extensions?.wallSide ?? "custom"),
      ...materialSlotMeta,
    },
    renderBinding: createProceduralRenderBinding({ surface: leafOrGlass }),
  };
}

export { wallPoint };
