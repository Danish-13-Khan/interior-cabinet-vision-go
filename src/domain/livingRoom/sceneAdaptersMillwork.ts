import type { InteriorObjectEntity } from "../interiorProject";
import { LIVING_ROOM_MATERIAL_IDS } from "./materials";
import { materialSlot } from "./sceneAdapterTypes";
import { boxPrimitive, roundedBoxPrimitive } from "./scenePrimitives";
import type { CompiledPrimitive } from "./sceneTypes";

export function compileTvUnit(object: InteriorObjectEntity): CompiledPrimitive[] {
  const { widthMm: w, heightMm: h, depthMm: d } = object.dimensions;
  const carcass = materialSlot(object, "carcass", LIVING_ROOM_MATERIAL_IDS.walnut);
  const fronts = materialSlot(object, "fronts");
  const doorCount = Math.max(1, Number(object.parameters.doorCount) || 3);
  const parts: CompiledPrimitive[] = [
    boxPrimitive("carcass", { width: w, height: h * 0.82, depth: d }, { x: 0, y: h * 0.55, z: 0 }, carcass),
    boxPrimitive("plinth", { width: w * 0.9, height: h * 0.18, depth: d * 0.72 }, { x: 0, y: h * 0.09, z: 0 }, LIVING_ROOM_MATERIAL_IDS.charcoalMetal),
    roundedBoxPrimitive("television", { width: w * 0.72, height: h * 1.45, depth: 34 }, { x: 0, y: h * 1.7, z: d * 0.22 }, LIVING_ROOM_MATERIAL_IDS.charcoalMetal, { radiusMm: 18, smoothness: 4 }),
    roundedBoxPrimitive("screen", { width: w * 0.68, height: h * 1.32, depth: 8 }, { x: 0, y: h * 1.7, z: d * 0.16 }, LIVING_ROOM_MATERIAL_IDS.clearGlass, { radiusMm: 12, smoothness: 4, castShadow: false }),
  ];
  const frontWidth = w / doorCount;
  for (let index = 0; index < doorCount; index += 1) {
    parts.push(boxPrimitive(
      `front-${index + 1}`,
      { width: frontWidth - 8, height: h * 0.68, depth: 22 },
      { x: -w / 2 + frontWidth * (index + 0.5), y: h * 0.55, z: -d / 2 - 12 },
      fronts,
    ));
  }
  return parts;
}

export function compileRug(object: InteriorObjectEntity): CompiledPrimitive[] {
  const { widthMm: w, heightMm: h, depthMm: d } = object.dimensions;
  return [boxPrimitive(
    "rug",
    { width: w, height: Math.max(10, h), depth: d },
    { x: 0, y: Math.max(5, h / 2), z: 0 },
    materialSlot(object, "surface", LIVING_ROOM_MATERIAL_IDS.woolRug),
    { castShadow: false },
  )];
}

export function compileMirror(object: InteriorObjectEntity): CompiledPrimitive[] {
  const { widthMm: w, heightMm: h, depthMm: d } = object.dimensions;
  const frame = materialSlot(object, "frame", LIVING_ROOM_MATERIAL_IDS.charcoalMetal);
  const glass = materialSlot(object, "mirror", LIVING_ROOM_MATERIAL_IDS.clearGlass);
  const border = Math.min(45, w * 0.055);
  return [
    boxPrimitive("mirror", { width: w - border * 2, height: h - border * 2, depth: Math.max(8, d * 0.35) }, { x: 0, y: h / 2, z: 0 }, glass),
    boxPrimitive("frame-top", { width: w, height: border, depth: d }, { x: 0, y: h - border / 2, z: 0 }, frame),
    boxPrimitive("frame-bottom", { width: w, height: border, depth: d }, { x: 0, y: border / 2, z: 0 }, frame),
    boxPrimitive("frame-left", { width: border, height: h - border * 2, depth: d }, { x: -w / 2 + border / 2, y: h / 2, z: 0 }, frame),
    boxPrimitive("frame-right", { width: border, height: h - border * 2, depth: d }, { x: w / 2 - border / 2, y: h / 2, z: 0 }, frame),
  ];
}

export function compileBookcase(object: InteriorObjectEntity): CompiledPrimitive[] {
  const { widthMm: w, heightMm: h, depthMm: d } = object.dimensions;
  const carcass = materialSlot(object, "carcass");
  const panel = Math.max(24, Math.min(55, w * 0.035));
  const shelfCount = Math.max(2, Number(object.parameters.shelfCount) || 5);
  const parts: CompiledPrimitive[] = [
    boxPrimitive("side-left", { width: panel, height: h, depth: d }, { x: -w / 2 + panel / 2, y: h / 2, z: 0 }, carcass),
    boxPrimitive("side-right", { width: panel, height: h, depth: d }, { x: w / 2 - panel / 2, y: h / 2, z: 0 }, carcass),
    boxPrimitive("back", { width: w - panel * 2, height: h, depth: 18 }, { x: 0, y: h / 2, z: d / 2 - 9 }, carcass, { castShadow: false }),
  ];
  for (let index = 0; index <= shelfCount; index += 1) {
    parts.push(boxPrimitive(`shelf-${index}`, { width: w - panel * 2, height: panel, depth: d }, { x: 0, y: panel / 2 + (h - panel) * index / shelfCount, z: 0 }, carcass));
  }
  return parts;
}
