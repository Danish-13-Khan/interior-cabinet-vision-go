import type { InteriorObjectEntity } from "../interiorProject";
import { LIVING_ROOM_MATERIAL_IDS } from "./materials";
import { materialSlot } from "./sceneAdapterTypes";
import { boxPrimitive } from "./scenePrimitives";
import type { CompiledPrimitive } from "./sceneTypes";

export function compileCornerWardrobe(object: InteriorObjectEntity): CompiledPrimitive[] {
  const leg = Number(object.parameters.legWidthMm) || 900;
  const h = object.dimensions.heightMm;
  const d = object.dimensions.depthMm;
  const carcass = materialSlot(object, "carcass", LIVING_ROOM_MATERIAL_IDS.walnut);
  const fronts = materialSlot(object, "fronts", LIVING_ROOM_MATERIAL_IDS.naturalOak);
  const panel = Math.max(22, Math.min(48, leg * 0.03));
  const toeH = Math.max(50, h * 0.035);
  const bodyH = h - toeH;
  return [
    boxPrimitive("leg-x", { width: leg, height: bodyH, depth: d }, { x: leg / 2 - panel, y: toeH + bodyH / 2, z: 0 }, carcass),
    boxPrimitive("leg-z", { width: d, height: bodyH, depth: leg }, { x: 0, y: toeH + bodyH / 2, z: leg / 2 - panel }, carcass),
    boxPrimitive("front-x", { width: leg - panel * 2, height: bodyH - panel, depth: panel }, { x: leg / 2 - panel, y: toeH + bodyH / 2, z: d / 2 + panel / 2 }, fronts),
    boxPrimitive("front-z", { width: panel, height: bodyH - panel, depth: leg - panel * 2 }, { x: d / 2 + panel / 2, y: toeH + bodyH / 2, z: leg / 2 - panel }, fronts),
  ];
}

export function compileRunFiller(object: InteriorObjectEntity): CompiledPrimitive[] {
  const { widthMm: w, heightMm: h, depthMm: d } = object.dimensions;
  return [boxPrimitive(
    "filler",
    { width: w, height: h, depth: d },
    { x: 0, y: h / 2, z: 0 },
    materialSlot(object, "carcass", LIVING_ROOM_MATERIAL_IDS.walnut),
  )];
}
