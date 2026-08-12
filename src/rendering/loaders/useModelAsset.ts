import { useMemo } from "react";
import type { RenderBinding } from "../../domain/livingRoom/renderAssetContracts";
import {
  getModelAsset,
  resolveNodeDrawStrategy,
} from "../assets/assetRegistry";

export type ModelAssetState = {
  modelAssetId: string | null;
  available: boolean;
  assetKey: string | null;
  strategy: "glb" | "procedural";
};

/**
 * Resolve whether a compiled node should draw as GLB or procedural fallback.
 * Actual GLB loading lands in a later milestone; unavailable assets always fall back.
 */
export function useModelAsset(binding: RenderBinding): ModelAssetState {
  return useMemo(() => {
    const strategy = resolveNodeDrawStrategy(binding);
    const asset = binding.modelAssetId ? getModelAsset(binding.modelAssetId) : null;
    return {
      modelAssetId: binding.modelAssetId ?? null,
      available: asset?.available === true,
      assetKey: asset?.assetKey ?? null,
      strategy,
    };
  }, [binding]);
}
