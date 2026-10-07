import { LIVING_ROOM_MATERIAL_IDS } from "./materials";
import { SCANNED_MATERIAL_SETS } from "./scannedMaterialSets";

const DEFAULT_UV_SCALE_MM = 1000;

/** Finishes without their own scan. The rug reuses the oatmeal hessian tile. */
const EXTRA_UV_SCALE_MM: Record<string, number> = {
  [LIVING_ROOM_MATERIAL_IDS.ceilingPaint]: 3200,
  [LIVING_ROOM_MATERIAL_IDS.charcoalMetal]: 600,
  [LIVING_ROOM_MATERIAL_IDS.clearGlass]: 1200,
  [LIVING_ROOM_MATERIAL_IDS.woolRug]: 269,
};

const scannedTileMm = new Map<string, number>(
  SCANNED_MATERIAL_SETS.map((set) => [set.materialId, set.tileMm]),
);

export function defaultUvScaleMmForMaterial(materialId: string) {
  return scannedTileMm.get(materialId) ?? EXTRA_UV_SCALE_MM[materialId] ?? DEFAULT_UV_SCALE_MM;
}
