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
import { measureUnscaledObjectSizeMeters } from "../../rendering/loaders/measureObjectBounds";
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
  const target = binding.targetSizeMm;
  const [scale, setScale] = useState(() =>
    target
      ? computeGlbScaleFactors(target, nativeSizeMmToMeters(definition.nativeSizeMm))
      : { x: 1, y: 1, z: 1 },
  );

  const slotKey = JSON.stringify(binding.materialBindings);
  const groupsKey = JSON.stringify(definition.materialGroups);

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
  }, [
    castShadow,
    groupsKey,
    materials,
    renderMode,
    renderQuality,
    scene,
    slotKey,
  ]);

  useLayoutEffect(() => {
    if (!target) return;
    const native = measureUnscaledObjectSizeMeters(scene);
    setScale(computeGlbScaleFactors(target, native));
  }, [scene, target?.depthMm, target?.heightMm, target?.widthMm]);

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
