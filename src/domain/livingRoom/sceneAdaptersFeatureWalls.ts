import type { InteriorObjectEntity } from "../interiorProject";
import { LIVING_ROOM_MATERIAL_IDS } from "./materials";
import { materialSlot } from "./sceneAdapterTypes";
import { boxPrimitive } from "./scenePrimitives";
import type { CompiledPrimitive } from "./sceneTypes";

const numberParameter = (
  object: InteriorObjectEntity,
  key: string,
  fallback: number,
) => Math.max(1, Number(object.parameters[key]) || fallback);

/**
 * Reusable timber feature-wall construction. Its dimensions and slat rhythm
 * live on the object, so bedroom and entry presets can reuse this adapter.
 */
export function compileFlutedFeatureWall(
  object: InteriorObjectEntity,
): CompiledPrimitive[] {
  const { widthMm: w, heightMm: h, depthMm: d } = object.dimensions;
  const backing = materialSlot(object, "backing", LIVING_ROOM_MATERIAL_IDS.walnut);
  const slats = materialSlot(object, "slats", LIVING_ROOM_MATERIAL_IDS.naturalOak);
  const trim = materialSlot(object, "trim", LIVING_ROOM_MATERIAL_IDS.walnut);
  const slatW = numberParameter(object, "slatWidthMm", 38);
  const gap = numberParameter(object, "slatGapMm", 14);
  const rail = numberParameter(object, "edgeRailMm", 48);
  const slatDepth = Math.max(12, Math.min(32, d * 0.35));
  const innerW = Math.max(slatW, w - rail * 2);
  const count = Math.max(1, Math.floor((innerW + gap) / (slatW + gap)));
  const actualGap = count > 1 ? (innerW - count * slatW) / (count - 1) : 0;
  const frontZ = d / 2 + slatDepth / 2;
  const parts: CompiledPrimitive[] = [
    boxPrimitive("backing", { width: w, height: h, depth: d }, { x: 0, y: h / 2, z: 0 }, backing),
    boxPrimitive("rail-left", { width: rail, height: h, depth: d + slatDepth }, { x: -w / 2 + rail / 2, y: h / 2, z: slatDepth / 2 }, trim),
    boxPrimitive("rail-right", { width: rail, height: h, depth: d + slatDepth }, { x: w / 2 - rail / 2, y: h / 2, z: slatDepth / 2 }, trim),
  ];
  for (let index = 0; index < count; index += 1) {
    const x = -innerW / 2 + slatW / 2 + index * (slatW + actualGap);
    parts.push(boxPrimitive(
      `slat-${index + 1}`,
      { width: slatW, height: h, depth: slatDepth },
      { x, y: h / 2, z: frontZ },
      slats,
    ));
  }
  return parts;
}
