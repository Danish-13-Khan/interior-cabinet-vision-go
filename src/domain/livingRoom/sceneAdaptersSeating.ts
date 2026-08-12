import type { InteriorObjectEntity } from "../interiorProject";
import { LIVING_ROOM_MATERIAL_IDS } from "./materials";
import { materialSlot } from "./sceneAdapterTypes";
import { boxPrimitive, cylinderPrimitive, roundedBoxPrimitive } from "./scenePrimitives";
import type { CompiledPrimitive } from "./sceneTypes";

export function compileSofa(object: InteriorObjectEntity): CompiledPrimitive[] {
  const { widthMm: w, heightMm: h, depthMm: d } = object.dimensions;
  const upholstery = materialSlot(object, "upholstery", LIVING_ROOM_MATERIAL_IDS.oatmealFabric);
  const legs = materialSlot(object, "legs", LIVING_ROOM_MATERIAL_IDS.charcoalMetal);
  const parts: CompiledPrimitive[] = [
    roundedBoxPrimitive("body", { width: w * 0.9, height: h * 0.18, depth: d * 0.72 }, { x: 0, y: h * 0.29, z: 0 }, upholstery, { radiusMm: 62, smoothness: 5 }),
    roundedBoxPrimitive("back-rail", { width: w * 0.86, height: h * 0.42, depth: d * 0.11 }, { x: 0, y: h * 0.59, z: d * 0.345 }, upholstery, { radiusMm: 42, smoothness: 5, rotationDegrees: { x: -7, y: 0, z: 0 } }),
    roundedBoxPrimitive("arm-left", { width: w * 0.075, height: h * 0.34, depth: d * 0.7 }, { x: -w * 0.45, y: h * 0.42, z: -d * 0.015 }, upholstery, { radiusMm: 42, smoothness: 5 }),
    roundedBoxPrimitive("arm-right", { width: w * 0.075, height: h * 0.34, depth: d * 0.7 }, { x: w * 0.45, y: h * 0.42, z: -d * 0.015 }, upholstery, { radiusMm: 42, smoothness: 5 }),
  ];
  const seats = Math.max(1, Number(object.parameters.seats) || 3);
  const seatWidth = (w * 0.78) / seats;
  for (let index = 0; index < seats; index += 1) {
    const cushionX = -w * 0.39 + seatWidth * (index + 0.5);
    parts.push(roundedBoxPrimitive(`seat-${index + 1}`, { width: seatWidth * 0.92, height: h * 0.13, depth: d * 0.55 }, { x: cushionX, y: h * 0.43, z: -d * 0.06 }, upholstery, { radiusMm: 48, smoothness: 5 }));
    parts.push(roundedBoxPrimitive(`back-cushion-${index + 1}`, { width: seatWidth * 0.89, height: h * 0.34, depth: d * 0.15 }, { x: cushionX, y: h * 0.64, z: d * 0.24 }, upholstery, { radiusMm: 54, smoothness: 5, rotationDegrees: { x: -8, y: 0, z: 0 } }));
  }
  for (const x of [-w * 0.38, w * 0.38]) {
    for (const z of [-d * 0.28, d * 0.28]) {
      parts.push(cylinderPrimitive(`leg-${x}-${z}`, { radiusTopMm: 17, radiusBottomMm: 22, heightMm: h * 0.2, radialSegments: 16 }, { x, y: h * 0.1, z }, legs));
    }
  }
  return parts;
}

export function compileChair(object: InteriorObjectEntity): CompiledPrimitive[] {
  const { widthMm: w, heightMm: h, depthMm: d } = object.dimensions;
  const upholstery = materialSlot(object, "upholstery", LIVING_ROOM_MATERIAL_IDS.oliveFabric);
  const frame = materialSlot(object, "frame");
  return [
    roundedBoxPrimitive("seat", { width: w * 0.72, height: h * 0.15, depth: d * 0.58 }, { x: 0, y: h * 0.44, z: -d * 0.04 }, upholstery, { radiusMm: 58, smoothness: 5 }),
    roundedBoxPrimitive("back", { width: w * 0.72, height: h * 0.48, depth: d * 0.13 }, { x: 0, y: h * 0.69, z: d * 0.33 }, upholstery, { radiusMm: 52, smoothness: 5, rotationDegrees: { x: -8, y: 0, z: 0 } }),
    roundedBoxPrimitive("arm-left", { width: 58, height: h * 0.3, depth: d * 0.6 }, { x: -w * 0.4, y: h * 0.47, z: 0 }, frame, { radiusMm: 24, smoothness: 4 }),
    roundedBoxPrimitive("arm-right", { width: 58, height: h * 0.3, depth: d * 0.6 }, { x: w * 0.4, y: h * 0.47, z: 0 }, frame, { radiusMm: 24, smoothness: 4 }),
    cylinderPrimitive("leg-left", { radiusTopMm: 21, radiusBottomMm: 28, heightMm: h * 0.38, radialSegments: 16 }, { x: -w * 0.32, y: h * 0.19, z: 0 }, frame),
    cylinderPrimitive("leg-right", { radiusTopMm: 21, radiusBottomMm: 28, heightMm: h * 0.38, radialSegments: 16 }, { x: w * 0.32, y: h * 0.19, z: 0 }, frame),
  ];
}

export function compileSectionalSofa(object: InteriorObjectEntity): CompiledPrimitive[] {
  const { widthMm: w, heightMm: h, depthMm: d } = object.dimensions;
  const upholstery = materialSlot(object, "upholstery", LIVING_ROOM_MATERIAL_IDS.oatmealFabric);
  const baseDepth = Math.min(d * 0.55, 900);
  const parts = compileSofa({ ...object, dimensions: { ...object.dimensions, depthMm: baseDepth } });
  parts.push(
    roundedBoxPrimitive("chaise-base", { width: w * 0.34, height: h * 0.22, depth: d * 0.92 }, { x: w * 0.28, y: h * 0.31, z: -d * 0.16 }, upholstery, { radiusMm: 70, smoothness: 5 }),
    roundedBoxPrimitive("chaise-cushion", { width: w * 0.3, height: h * 0.15, depth: d * 0.78 }, { x: w * 0.28, y: h * 0.47, z: -d * 0.2 }, upholstery, { radiusMm: 65, smoothness: 5 }),
  );
  return parts;
}

export function compileOttoman(object: InteriorObjectEntity): CompiledPrimitive[] {
  const { widthMm: w, heightMm: h, depthMm: d } = object.dimensions;
  return [
    boxPrimitive("base", { width: w * 0.9, height: h * 0.25, depth: d * 0.9 }, { x: 0, y: h * 0.125, z: 0 }, materialSlot(object, "base", LIVING_ROOM_MATERIAL_IDS.walnut)),
    roundedBoxPrimitive("cushion", { width: w, height: h * 0.75, depth: d }, { x: 0, y: h * 0.625, z: 0 }, materialSlot(object, "upholstery", LIVING_ROOM_MATERIAL_IDS.oliveFabric), { radiusMm: 90, smoothness: 6 }),
  ];
}
