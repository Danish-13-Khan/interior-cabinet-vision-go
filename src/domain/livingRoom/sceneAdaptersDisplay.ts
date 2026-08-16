import type { InteriorObjectEntity } from "../interiorProject";
import { LIVING_ROOM_MATERIAL_IDS } from "./materials";
import { materialSlot } from "./sceneAdapterTypes";
import { boxPrimitive, cylinderPrimitive, roundedBoxPrimitive } from "./scenePrimitives";
import type { CompiledPrimitive } from "./sceneTypes";

const positiveParameter = (object: InteriorObjectEntity, key: string, fallback: number) =>
  Math.max(1, Number(object.parameters[key]) || fallback);

/** Wall-mounted display cabinetry, reusable wherever a lit vertical niche is needed. */
export function compileDisplayNiche(object: InteriorObjectEntity): CompiledPrimitive[] {
  const { widthMm: w, heightMm: h, depthMm: d } = object.dimensions;
  const carcass = materialSlot(object, "carcass", LIVING_ROOM_MATERIAL_IDS.walnut);
  const back = materialSlot(object, "back", LIVING_ROOM_MATERIAL_IDS.charcoalMetal);
  const shelves = materialSlot(object, "shelves", LIVING_ROOM_MATERIAL_IDS.naturalOak);
  const panel = Math.max(22, Math.min(42, w * 0.06));
  const count = Math.max(2, Math.round(positiveParameter(object, "shelfCount", 4)));
  const innerW = w - panel * 2;
  const innerH = h - panel * 2;
  const parts: CompiledPrimitive[] = [
    boxPrimitive("back", { width: innerW, height: innerH, depth: 14 }, { x: 0, y: h / 2, z: d / 2 - 7 }, back),
    boxPrimitive("side-left", { width: panel, height: h, depth: d }, { x: -w / 2 + panel / 2, y: h / 2, z: 0 }, carcass),
    boxPrimitive("side-right", { width: panel, height: h, depth: d }, { x: w / 2 - panel / 2, y: h / 2, z: 0 }, carcass),
    boxPrimitive("top", { width: w, height: panel, depth: d }, { x: 0, y: h - panel / 2, z: 0 }, carcass),
    boxPrimitive("bottom", { width: w, height: panel, depth: d }, { x: 0, y: panel / 2, z: 0 }, carcass),
  ];
  for (let index = 1; index < count; index += 1) {
    const y = panel + (innerH * index) / count;
    parts.push(boxPrimitive(
      `shelf-${index}`,
      { width: innerW, height: panel * 0.8, depth: d - 12 },
      { x: 0, y, z: 0 },
      shelves,
    ));
  }
  return parts;
}

export function compileDecorVase(object: InteriorObjectEntity): CompiledPrimitive[] {
  const { widthMm: w, heightMm: h } = object.dimensions;
  const material = materialSlot(object, "surface", LIVING_ROOM_MATERIAL_IDS.walnut);
  return [
    cylinderPrimitive("body", { radiusTopMm: w * 0.3, radiusBottomMm: w * 0.42, heightMm: h * 0.75 }, { x: 0, y: h * 0.375, z: 0 }, material),
    cylinderPrimitive("neck", { radiusTopMm: w * 0.16, heightMm: h * 0.32 }, { x: 0, y: h * 0.84, z: 0 }, material),
  ];
}

export function compileDecorSculpture(object: InteriorObjectEntity): CompiledPrimitive[] {
  const { widthMm: w, heightMm: h, depthMm: d } = object.dimensions;
  const material = materialSlot(object, "surface", LIVING_ROOM_MATERIAL_IDS.naturalOak);
  return [roundedBoxPrimitive("sculpture", { width: w, height: h, depth: d }, { x: 0, y: h / 2, z: 0 }, material, { radiusMm: Math.min(w, h) * 0.28 })];
}
