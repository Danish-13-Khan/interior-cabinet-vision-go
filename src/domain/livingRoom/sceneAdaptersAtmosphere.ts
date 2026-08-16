import type { InteriorObjectEntity } from "../interiorProject";
import { LIVING_ROOM_MATERIAL_IDS } from "./materials";
import { materialSlot } from "./sceneAdapterTypes";
import { boxPrimitive, cylinderPrimitive, roundedBoxPrimitive } from "./scenePrimitives";
import type { CompiledPrimitive } from "./sceneTypes";

/** Ceiling fan with configurable blade count; suitable for any interior room. */
export function compileCeilingFan(object: InteriorObjectEntity): CompiledPrimitive[] {
  const { widthMm: w, heightMm: h, depthMm: d } = object.dimensions;
  const metal = materialSlot(object, "metal", LIVING_ROOM_MATERIAL_IDS.charcoalMetal);
  const wood = materialSlot(object, "blades", LIVING_ROOM_MATERIAL_IDS.walnut);
  const count = Math.max(3, Math.round(Number(object.parameters.bladeCount) || 4));
  const parts: CompiledPrimitive[] = [
    cylinderPrimitive("downrod", { radiusTopMm: 22, heightMm: h * 0.55 }, { x: 0, y: h * 0.72, z: 0 }, metal),
    cylinderPrimitive("motor", { radiusTopMm: Math.min(w, d) * 0.12, heightMm: h * 0.3 }, { x: 0, y: h * 0.4, z: 0 }, metal),
  ];
  for (let index = 0; index < count; index += 1) {
    const angle = (360 / count) * index;
    parts.push(roundedBoxPrimitive(
      `blade-${index + 1}`,
      { width: w * 0.44, height: Math.max(16, h * 0.08), depth: d * 0.11 },
      { x: w * 0.22, y: h * 0.28, z: 0 },
      wood,
      { radiusMm: 18, smoothness: 3, rotationDegrees: { x: 0, y: angle, z: 0 } },
    ));
  }
  return parts;
}

/** Soft two-panel curtain treatment for window-facing presentation views. */
export function compileCurtainSet(object: InteriorObjectEntity): CompiledPrimitive[] {
  const { widthMm: w, heightMm: h, depthMm: d } = object.dimensions;
  const fabric = materialSlot(object, "fabric", LIVING_ROOM_MATERIAL_IDS.oatmealFabric);
  const rail = materialSlot(object, "rail", LIVING_ROOM_MATERIAL_IDS.charcoalMetal);
  const panelW = w * 0.43;
  return [
    boxPrimitive("rail", { width: w, height: 26, depth: 28 }, { x: 0, y: h - 13, z: 0 }, rail),
    roundedBoxPrimitive("panel-left", { width: panelW, height: h * 0.96, depth: d }, { x: -w * 0.27, y: h * 0.48, z: 0 }, fabric, { radiusMm: 20, smoothness: 3 }),
    roundedBoxPrimitive("panel-right", { width: panelW, height: h * 0.96, depth: d }, { x: w * 0.27, y: h * 0.48, z: 0 }, fabric, { radiusMm: 20, smoothness: 3 }),
  ];
}
