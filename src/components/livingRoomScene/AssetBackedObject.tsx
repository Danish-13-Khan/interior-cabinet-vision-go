import { Suspense } from "react";
import { type ThreeEvent } from "@react-three/fiber";
import type { CompiledMaterial, CompiledPrimitive } from "../../domain/livingRoom";
import type { RenderQuality } from "../../domain/interiorProject";
import type {
  ModelAssetDefinition,
  RenderBinding,
  RenderMode,
} from "../../domain/livingRoom/renderAssetContracts";
import { reportModelGlbFallback } from "../../domain/livingRoom/modelQualityFeedback";
import { AssetBackedGlbContent } from "./AssetBackedGlbContent";
import { GlbLoadErrorBoundary } from "./GlbLoadErrorBoundary";
import { ProceduralFallbackObject } from "./ProceduralFallbackObject";

type AssetBackedObjectProps = {
  url: string;
  definition: ModelAssetDefinition;
  binding: RenderBinding;
  materials: Map<string, CompiledMaterial>;
  primitives: CompiledPrimitive[];
  selected: boolean;
  renderMode: RenderMode;
  renderQuality?: RenderQuality;
  glbCasterSlot?: number;
  maxGlbCasters?: number;
  onReady?: () => void;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
};

/** Load and scale a registry GLB; fall back to procedural primitives on failure. */
export function AssetBackedObject({
  url,
  definition,
  binding,
  materials,
  primitives,
  selected,
  renderMode,
  renderQuality,
  glbCasterSlot,
  maxGlbCasters,
  onReady,
  onPointerDown,
}: AssetBackedObjectProps) {
  const fallback = (
    <ProceduralFallbackObject
      primitives={primitives}
      materials={materials}
      selected={selected}
      renderMode={renderMode}
      renderQuality={renderQuality}
      onPointerDown={onPointerDown}
    />
  );

  return (
    <GlbLoadErrorBoundary fallback={fallback} onError={reportModelGlbFallback}>
      <Suspense fallback={fallback}>
        <AssetBackedGlbContent
          url={url}
          definition={definition}
          binding={binding}
          materials={materials}
          selected={selected}
          renderMode={renderMode}
          renderQuality={renderQuality}
          glbCasterSlot={glbCasterSlot}
          maxGlbCasters={maxGlbCasters}
          onReady={onReady}
          onPointerDown={onPointerDown}
        />
      </Suspense>
    </GlbLoadErrorBoundary>
  );
}
