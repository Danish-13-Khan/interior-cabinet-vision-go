import { clampCabinetConfig } from "../cabinetDimensions";
import { createCabinetGeometry } from "../cabinetGeometry";
import { cabinetFromObject } from "../interiorProject/cabinetAdapterCabinets";
import type { InteriorObjectEntity } from "../interiorProject";
import { LIVING_ROOM_MATERIAL_IDS } from "./materials";
import {
  compositionFillerPrimitives,
  panelsToCompiledPrimitives,
} from "./cabinetSceneBridge";
import { materialSlot } from "./sceneAdapterTypes";
import { boxPrimitive } from "./scenePrimitives";
import type { CompiledPrimitive } from "./sceneTypes";

export const CABINET_FALLBACK_PRIMITIVE_ID = "fallback-carcass";

export function isCabinetGeometryFallback(
  primitives: readonly CompiledPrimitive[],
): boolean {
  return primitives.some((primitive) => primitive.id === CABINET_FALLBACK_PRIMITIVE_ID);
}

function labeledFallback(object: InteriorObjectEntity): CompiledPrimitive[] {
  const { widthMm: w, heightMm: h, depthMm: d } = object.dimensions;
  return [boxPrimitive(
    CABINET_FALLBACK_PRIMITIVE_ID,
    { width: w, height: h, depth: d },
    { x: 0, y: h / 2, z: 0 },
    materialSlot(object, "carcass", LIVING_ROOM_MATERIAL_IDS.naturalOak),
  )];
}

/**
 * Shared cabinet geometry: normalized config → engineering panels → scene primitives.
 * Golden families must not use compileBookcase.
 */
export function compileCabinet(object: InteriorObjectEntity): CompiledPrimitive[] {
  const cabinet = cabinetFromObject(object);
  if (!cabinet) return labeledFallback(object);
  const config = clampCabinetConfig(cabinet.config);
  return [
    ...panelsToCompiledPrimitives(
      createCabinetGeometry(config),
      object,
      config.dimensions.height,
    ),
    ...compositionFillerPrimitives(config, object),
  ];
}
