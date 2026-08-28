import { useMemo } from "react";
import type { CompiledMaterial } from "../../domain/livingRoom";
import type { RenderQuality } from "../../domain/interiorProject";
import { resolveModelViewMaterialQuality } from "../../domain/livingRoom/modelViewPreviewDefaults";
import type { RenderMode } from "../../domain/livingRoom/renderAssetContracts";
import { useModelViewPreviewQuality } from "../ModelViewPreviewProfile";
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
  const modelViewQuality = useModelViewPreviewQuality();
  return useMemo(
    () => createPbrMaterialDescriptor(material, mode, {
      primitiveId,
      quality: modelViewQuality ?? quality,
      modeQuality: modelViewQuality ? resolveModelViewMaterialQuality(modelViewQuality) : undefined,
      modelViewPreview: Boolean(modelViewQuality),
    }),
    [material, mode, modelViewQuality, primitiveId, quality],
  );
}
