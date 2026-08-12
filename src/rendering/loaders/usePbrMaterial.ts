import { useMemo } from "react";
import type { CompiledMaterial } from "../../domain/livingRoom";
import type { RenderQuality } from "../../domain/interiorProject";
import type { RenderMode } from "../../domain/livingRoom/renderAssetContracts";
import {
  createPbrMaterialDescriptor,
  type PbrMaterialDescriptor,
} from "../materials/createPbrMaterial";

/** Memoized PBR descriptor for R3F mesh materials. */
export function usePbrMaterial(
  material: CompiledMaterial,
  mode: RenderMode,
  primitiveId?: string,
  quality?: RenderQuality,
): PbrMaterialDescriptor {
  return useMemo(
    () => createPbrMaterialDescriptor(material, mode, { primitiveId, quality }),
    [material, mode, primitiveId, quality],
  );
}
