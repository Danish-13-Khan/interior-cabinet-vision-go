import { SCANNED_MATERIAL_SETS } from "../scannedMaterialSets";
import type { CompiledMaterial } from "../sceneTypes";
import type { CyclesMaterial, CyclesScanSource } from "./types";

/** Where Phase 2 keeps the raw Poly Haven PNGs, keyed by material asset id. */
export const CYCLES_SCAN_SOURCE_ROOT = "render-sources/materials";

export function scanSourceFor(materialAssetId: string): CyclesScanSource | null {
  const set = SCANNED_MATERIAL_SETS.find((item) => item.materialId === materialAssetId);
  if (!set) return null;
  return {
    sourceDir: `${CYCLES_SCAN_SOURCE_ROOT}/${set.materialId}`,
    polyhaven: set.polyhaven,
    tileMm: set.tileMm,
  };
}

/**
 * One Cycles material per compiled material. The style colour stays the tint;
 * a scan contributes mean-normalised detail, the same rule the viewport applies.
 * Imported project textures (data URLs) are not carried: those finishes render
 * with their colour only and the bundle warns about them.
 */
export function cyclesMaterialsFor(materials: readonly CompiledMaterial[]): { materials: CyclesMaterial[]; warnings: string[] } {
  const warnings: string[] = [];
  const result = materials.map((material): CyclesMaterial => {
    if (material.textureMapUrl) {
      warnings.push(`${material.name} (${material.id}) uses an imported texture; Cycles renders its colour only.`);
    }
    return {
      id: material.id,
      name: material.name,
      kind: material.kind,
      color: material.color,
      roughness: material.roughness,
      metalness: material.metalness,
      opacity: material.opacity,
      tileMm: material.uvScaleMm,
      uvRotationDeg: material.uvRotationDeg ?? 0,
      grainDirection: material.grainDirection ?? null,
      scan: scanSourceFor(material.materialAssetId),
    };
  });
  return { materials: result, warnings };
}
