import {
  clampCabinetConfig,
  getDefaultCabinetConfig,
  type CabinetInstance,
} from "../cabinetDimensions";
import {
  GOLDEN_CABINET_FAMILY_IDS,
  type GoldenCabinetFamilyId,
} from "./types";
import { familyType } from "./families";

const GOLDEN_SIZES: Record<GoldenCabinetFamilyId, { width: number; height: number; depth: number }> = {
  "frameless-standard-base": { width: 900, height: 720, depth: 560 },
  "frameless-standard-wall": { width: 900, height: 720, depth: 350 },
  "frameless-standard-tall": { width: 600, height: 2100, depth: 560 },
  "frameless-standard-drawer": { width: 900, height: 720, depth: 560 },
};

const GOLDEN_SKUS: Record<GoldenCabinetFamilyId, string> = {
  "frameless-standard-base": "MW-BASE-900",
  "frameless-standard-wall": "MW-WALL-900",
  "frameless-standard-tall": "MW-TALL-600",
  "frameless-standard-drawer": "MW-DRAWER-900",
};

export function goldenCatalogItemId(
  familyId: GoldenCabinetFamilyId,
):
  | "living:base-cabinet-900"
  | "living:wall-cabinet-900"
  | "living:tall-pantry-600"
  | "living:drawer-cabinet-900" {
  if (familyId === "frameless-standard-tall") return "living:tall-pantry-600";
  if (familyId === "frameless-standard-wall") return "living:wall-cabinet-900";
  if (familyId === "frameless-standard-drawer") return "living:drawer-cabinet-900";
  return "living:base-cabinet-900";
}

export function createGoldenCabinetInstance(
  familyId: GoldenCabinetFamilyId,
  id = `golden-${familyType(familyId)}`,
): CabinetInstance {
  const type = familyType(familyId);
  const size = GOLDEN_SIZES[familyId];
  const config = clampCabinetConfig({
    ...getDefaultCabinetConfig(type),
    type,
    familyId,
    catalogItemId: goldenCatalogItemId(familyId),
    sku: GOLDEN_SKUS[familyId],
    dimensions: {
      ...getDefaultCabinetConfig(type).dimensions,
      ...size,
    },
  });
  return {
    id,
    name: `${type} ${size.width}`,
    displayCategory: "storage",
    interiorObjectId: id,
    config,
    placement: {
      x: 0,
      y: type === "wall" ? 1400 : 0,
      z: 0,
      rotation: 0,
      attachment: type === "wall" ? "back-wall" : "floor",
    },
    layerId: "layer-default",
    groupId: null,
  };
}

export function listGoldenCabinetInstances(): CabinetInstance[] {
  return GOLDEN_CABINET_FAMILY_IDS.map((familyId) => createGoldenCabinetInstance(familyId));
}
