import type { InteriorObjectEntity } from "../interiorProject";
import { LIVING_ROOM_MATERIAL_IDS } from "./materials";
import { materialSlot } from "./sceneAdapterTypes";
import { boxPrimitive, cylinderPrimitive, roundedBoxPrimitive } from "./scenePrimitives";
import type { CompiledPrimitive } from "./sceneTypes";

export function compileCoffeeTable(object: InteriorObjectEntity): CompiledPrimitive[] {
  const { widthMm: w, heightMm: h, depthMm: d } = object.dimensions;
  const top = materialSlot(object, "top");
  const frame = materialSlot(object, "frame", LIVING_ROOM_MATERIAL_IDS.charcoalMetal);
  const parts: CompiledPrimitive[] = [
    roundedBoxPrimitive("top", { width: w, height: Math.max(45, h * 0.14), depth: d }, { x: 0, y: h * 0.9, z: 0 }, top, { radiusMm: 55, smoothness: 5 }),
  ];
  for (const x of [-w * 0.39, w * 0.39]) {
    for (const z of [-d * 0.34, d * 0.34]) {
      parts.push(boxPrimitive(`leg-${x}-${z}`, { width: 38, height: h * 0.82, depth: 38 }, { x, y: h * 0.41, z }, frame));
    }
  }
  return parts;
}

export function compileSideTable(object: InteriorObjectEntity): CompiledPrimitive[] {
  const { widthMm: w, heightMm: h } = object.dimensions;
  const top = materialSlot(object, "top", LIVING_ROOM_MATERIAL_IDS.clearGlass);
  const frame = materialSlot(object, "frame", LIVING_ROOM_MATERIAL_IDS.charcoalMetal);
  return [
    cylinderPrimitive("top", { radiusTopMm: w / 2, heightMm: 22, radialSegments: 40 }, { x: 0, y: h - 20, z: 0 }, top),
    cylinderPrimitive("stem", { radiusTopMm: 22, heightMm: h - 45 }, { x: 0, y: (h - 45) / 2, z: 0 }, frame),
    cylinderPrimitive("base", { radiusTopMm: w * 0.34, heightMm: 24, radialSegments: 36 }, { x: 0, y: 12, z: 0 }, frame),
  ];
}

export function compileRoundCoffeeTable(object: InteriorObjectEntity): CompiledPrimitive[] {
  const { widthMm: w, heightMm: h } = object.dimensions;
  const top = materialSlot(object, "top", LIVING_ROOM_MATERIAL_IDS.walnut);
  const frame = materialSlot(object, "frame", LIVING_ROOM_MATERIAL_IDS.charcoalMetal);
  return [
    cylinderPrimitive("top", { radiusTopMm: w / 2, heightMm: 48, radialSegments: 48 }, { x: 0, y: h - 24, z: 0 }, top),
    cylinderPrimitive("base", { radiusTopMm: w * 0.27, radiusBottomMm: w * 0.38, heightMm: h - 48, radialSegments: 40 }, { x: 0, y: (h - 48) / 2, z: 0 }, frame),
  ];
}

export function compileFloorLamp(object: InteriorObjectEntity): CompiledPrimitive[] {
  const { widthMm: w, heightMm: h } = object.dimensions;
  const frame = materialSlot(object, "frame", LIVING_ROOM_MATERIAL_IDS.charcoalMetal);
  const shade = materialSlot(object, "shade", LIVING_ROOM_MATERIAL_IDS.oatmealFabric);
  return [
    cylinderPrimitive("base", { radiusTopMm: w * 0.34, heightMm: 28, radialSegments: 32 }, { x: 0, y: 14, z: 0 }, frame),
    cylinderPrimitive("stem", { radiusTopMm: 18, heightMm: h * 0.72, radialSegments: 16 }, { x: 0, y: h * 0.38, z: 0 }, frame),
    cylinderPrimitive("shade", { radiusTopMm: w * 0.32, radiusBottomMm: w * 0.46, heightMm: h * 0.24, radialSegments: 32 }, { x: 0, y: h * 0.86, z: 0 }, shade),
  ];
}

export function compileIndoorPlant(object: InteriorObjectEntity): CompiledPrimitive[] {
  const { widthMm: w, heightMm: h } = object.dimensions;
  const foliage = materialSlot(object, "foliage", LIVING_ROOM_MATERIAL_IDS.oliveFabric);
  const planter = materialSlot(object, "planter", LIVING_ROOM_MATERIAL_IDS.woolRug);
  return [
    cylinderPrimitive("planter", { radiusTopMm: w * 0.27, radiusBottomMm: w * 0.2, heightMm: h * 0.28, radialSegments: 32 }, { x: 0, y: h * 0.14, z: 0 }, planter),
    cylinderPrimitive("stem", { radiusTopMm: 24, heightMm: h * 0.55, radialSegments: 12 }, { x: 0, y: h * 0.47, z: 0 }, LIVING_ROOM_MATERIAL_IDS.walnut),
    cylinderPrimitive("leaf-a", { radiusTopMm: w * 0.25, radiusBottomMm: 35, heightMm: h * 0.34, radialSegments: 20 }, { x: -w * 0.14, y: h * 0.74, z: 0 }, foliage, { rotationDegrees: { x: 0, y: 0, z: 28 } }),
    cylinderPrimitive("leaf-b", { radiusTopMm: w * 0.22, radiusBottomMm: 35, heightMm: h * 0.31, radialSegments: 20 }, { x: w * 0.16, y: h * 0.77, z: 0 }, foliage, { rotationDegrees: { x: 0, y: 0, z: -32 } }),
    cylinderPrimitive("leaf-c", { radiusTopMm: w * 0.23, radiusBottomMm: 30, heightMm: h * 0.32, radialSegments: 20 }, { x: 0, y: h * 0.84, z: 0 }, foliage),
  ];
}
