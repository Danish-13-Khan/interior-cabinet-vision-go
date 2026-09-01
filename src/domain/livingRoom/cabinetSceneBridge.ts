import { getResolvedFillers } from "../cabinetComposition";
import type { CabinetConfig } from "../cabinetDimensions";
import type { CabinetPanelGeometry } from "../cabinetGeometry";
import type { InteriorObjectEntity } from "../interiorProject";
import { cabinetSceneRole, materialIdForCabinetRole } from "./cabinetSceneRoles";
import { boxPrimitive } from "./scenePrimitives";
import type { CompiledPrimitive } from "./sceneTypes";

const METRE = 1000;

function metresToMm(value: number) {
  return value * METRE;
}

/** Convert center-origin metre panels to bottom-origin millimetre primitives. */
export function panelToCompiledPrimitive(
  panel: CabinetPanelGeometry,
  object: InteriorObjectEntity,
  heightMm: number,
): CompiledPrimitive {
  const role = cabinetSceneRole(panel.name, panel.material);
  const [widthM, heightM, depthM] = panel.size;
  const [xM, yM, zM] = panel.position;
  return boxPrimitive(
    panel.name,
    {
      width: metresToMm(widthM),
      height: metresToMm(heightM),
      depth: metresToMm(depthM),
    },
    {
      x: metresToMm(xM),
      y: metresToMm(yM) + heightMm / 2,
      z: metresToMm(zM),
    },
    materialIdForCabinetRole(object, role),
    { castShadow: role !== "back" },
  );
}

export function panelsToCompiledPrimitives(
  panels: readonly CabinetPanelGeometry[],
  object: InteriorObjectEntity,
  heightMm: number,
): CompiledPrimitive[] {
  return panels.map((panel) => panelToCompiledPrimitive(panel, object, heightMm));
}

/** Slim face strips — fillers must not compile as full cabinets. */
export function compositionFillerPrimitives(
  config: CabinetConfig,
  object: InteriorObjectEntity,
): CompiledPrimitive[] {
  const fillers = getResolvedFillers(config);
  const width = config.dimensions.width;
  const depth = config.dimensions.depth;
  const board = config.dimensions.boardThickness;
  const toe = config.toeKickHeight;
  const faceH = Math.max(1, config.dimensions.height - toe);
  const frontZ = depth / 2 + board / 2;
  const y = toe + faceH / 2;
  const materialId = materialIdForCabinetRole(object, "filler");
  const strips: CompiledPrimitive[] = [];
  if (fillers.leftMm > 0) {
    strips.push(boxPrimitive(
      "filler-left",
      { width: fillers.leftMm, height: faceH, depth: board },
      { x: -width / 2 + fillers.leftMm / 2, y, z: frontZ },
      materialId,
    ));
  }
  if (fillers.rightMm > 0) {
    strips.push(boxPrimitive(
      "filler-right",
      { width: fillers.rightMm, height: faceH, depth: board },
      { x: width / 2 - fillers.rightMm / 2, y, z: frontZ },
      materialId,
    ));
  }
  return strips;
}
