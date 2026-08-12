import { useGLTF } from "@react-three/drei";
import { Suspense, useLayoutEffect, useMemo, useState } from "react";
import type { CompiledMaterial, CompiledPrimitive } from "../../domain/livingRoom";
import type { RenderQuality } from "../../domain/interiorProject";
import {
  computeGlbScaleFactors,
  nativeSizeMmToMeters,
} from "../../domain/livingRoom/glbScale";
import type {
  ModelAssetDefinition,
  RenderBinding,
  RenderMode,
} from "../../domain/livingRoom/renderAssetContracts";
import { measureObjectSizeMeters } from "../../rendering/loaders/measureObjectBounds";
import { applyGlbSlotMaterials } from "../../rendering/materials/applyGlbSlotMaterials";
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
};

function GlbSceneContent({
  url,
  definition,
  binding,
  materials,
  renderMode,
  renderQuality,
}: Omit<AssetBackedObjectProps, "primitives" | "selected">) {
  const gltf = useGLTF(url);
  const castShadow = renderMode === "hero";
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const [scale, setScale] = useState(() =>
    binding.targetSizeMm
      ? computeGlbScaleFactors(
          binding.targetSizeMm,
          nativeSizeMmToMeters(definition.nativeSizeMm),
        )
      : { x: 1, y: 1, z: 1 },
  );

  useLayoutEffect(() => {
    applyGlbSlotMaterials(scene, {
      materialGroups: definition.materialGroups,
      materialBindings: binding.materialBindings,
      materials,
      renderMode,
      renderQuality,
      castShadow,
      receiveShadow: true,
    });
    if (!binding.targetSizeMm) return;
    const measured = measureObjectSizeMeters(scene);
    setScale(computeGlbScaleFactors(binding.targetSizeMm, measured));
  }, [
    binding.materialBindings,
    binding.targetSizeMm,
    castShadow,
    definition.materialGroups,
    materials,
    renderMode,
    renderQuality,
    scene,
  ]);

  return <primitive object={scene} scale={[scale.x, scale.y, scale.z]} />;
}

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
}: AssetBackedObjectProps) {
  const fallback = (
    <ProceduralFallbackObject
      primitives={primitives}
      materials={materials}
      selected={selected}
      renderMode={renderMode}
      renderQuality={renderQuality}
    />
  );

  return (
    <GlbLoadErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <GlbSceneContent
          url={url}
          definition={definition}
          binding={binding}
          materials={materials}
          renderMode={renderMode}
          renderQuality={renderQuality}
        />
      </Suspense>
    </GlbLoadErrorBoundary>
  );
}
