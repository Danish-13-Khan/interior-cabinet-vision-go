import { useMemo } from "react";
import type { CompiledMaterial } from "../../domain/livingRoom";
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
): PbrMaterialDescriptor {
  return useMemo(
    () => createPbrMaterialDescriptor(material, mode, { primitiveId }),
    [material, mode, primitiveId],
  );
}
