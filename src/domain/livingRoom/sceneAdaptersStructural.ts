import type { InteriorObjectEntity } from "../interiorProject";
import { LIVING_ROOM_MATERIAL_IDS } from "./materials";
import { boxPrimitive, cylinderPrimitive } from "./scenePrimitives";
import { materialSlot } from "./sceneAdapterTypes";

export function compileStructuralColumn(object: InteriorObjectEntity) {
  const material = materialSlot(object, "finish", LIVING_ROOM_MATERIAL_IDS.wallPaint);
  const width = object.dimensions.widthMm;
  const depth = object.dimensions.depthMm;
  const height = object.dimensions.heightMm;
  if (object.parameters.profile === "round") {
    return [cylinderPrimitive(
      "column",
      { radiusTopMm: Math.min(width, depth) / 2, heightMm: height, radialSegments: 32 },
      { x: 0, y: height / 2, z: 0 },
      material,
    )];
  }
  return [boxPrimitive(
    "column",
    { width, height, depth },
    { x: 0, y: height / 2, z: 0 },
    material,
  )];
}
