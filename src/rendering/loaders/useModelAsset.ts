import { useMemo } from "react";
import type { RenderBinding } from "../../domain/livingRoom/renderAssetContracts";
import type { ModelAssetDefinition } from "../../domain/livingRoom/renderAssetContracts";
import {
  getModelAsset,
  resolveModelAssetUrl,
  resolveNodeDrawStrategy,
} from "../assets/assetRegistry";

export type ModelAssetState = {
  modelAssetId: string | null;
  available: boolean;
  assetKey: string | null;
  url: string | null;
  strategy: "glb" | "procedural";
  definition: ModelAssetDefinition | null;
};

/**
 * Resolve whether a compiled node should draw as GLB or procedural fallback.
 * Unavailable or missing registry entries always fall back to procedural.
 */
export function useModelAsset(binding: RenderBinding): ModelAssetState {
  return useMemo(() => {
    if (binding.strategy === "glb" && binding.modelUrl) {
      return {
        modelAssetId: binding.modelAssetId ?? "imported", available: true,
        assetKey: binding.modelUrl, url: binding.modelUrl, strategy: "glb",
        definition: {
          id: binding.modelAssetId ?? "imported", name: "Imported model", catalogItemId: "imported",
          assetKey: binding.modelUrl, available: true, defaultUvScaleMm: binding.uvScaleMm ?? 1000,
          nativeSizeMm: binding.targetSizeMm ?? { widthMm: 1000, heightMm: 1000, depthMm: 1000 },
          materialGroups: binding.modelMaterialGroups ?? {},
        },
      };
    }
    const strategy = resolveNodeDrawStrategy(binding);
    const definition = binding.modelAssetId
      ? getModelAsset(binding.modelAssetId)
      : null;
    const available = definition?.available === true;
    const assetKey = definition?.assetKey ?? null;
    return {
      modelAssetId: binding.modelAssetId ?? null,
      available,
      assetKey,
      url: available && assetKey ? resolveModelAssetUrl(assetKey) : null,
      strategy,
      definition,
    };
  }, [binding.modelAssetId, binding.modelUrl, binding.strategy, binding.uvScaleMm, binding.targetSizeMm, binding.modelMaterialGroups]);
}
