import { Edges, useGLTF } from "@react-three/drei";
import { Suspense, useLayoutEffect, useMemo, useState } from "react";
import { Box3, Vector3 } from "three";
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
  selected,
  renderMode,
  renderQuality,
}: Omit<AssetBackedObjectProps, "primitives">) {
  const gltf = useGLTF(url);
  const castShadow = renderMode === "hero";
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const target = binding.targetSizeMm;
  const [scale, setScale] = useState(() =>
    target
      ? computeGlbScaleFactors(target, nativeSizeMmToMeters(definition.nativeSizeMm))
      : { x: 1, y: 1, z: 1 },
  );
  const [nativeSize, setNativeSize] = useState(() =>
    nativeSizeMmToMeters(definition.nativeSizeMm),
  );

  const slotKey = JSON.stringify(binding.materialBindings);
  const groupsKey = JSON.stringify(definition.materialGroups);

  useLayoutEffect(() => {
    const bounds = new Box3().setFromObject(scene);
    const center = bounds.getCenter(new Vector3());
    scene.position.set(-center.x, -bounds.min.y, -center.z);
    const size = bounds.getSize(new Vector3());
    setNativeSize(size);
    if (target) setScale(computeGlbScaleFactors(target, size));
  }, [scene, target?.depthMm, target?.heightMm, target?.widthMm]);

  useLayoutEffect(() => {
    applyGlbSlotMaterials(scene, {
      materialGroups: definition.materialGroups,
      materialBindings: binding.materialBindings,
      materials,
      renderMode,
      renderQuality,
      castShadow,
      receiveShadow: true,
      importedTextures: binding.modelTextureUrls,
    });
  }, [
    castShadow,
    groupsKey,
    materials,
    renderMode,
    renderQuality,
    scene,
    slotKey,
    binding.modelTextureUrls,
  ]);

  return (
    /* The selection frame lives in the same normalized, scaled group as the GLB. */
    <group scale={[scale.x, scale.y, scale.z]}>
        <primitive object={scene} />
        {selected ? (
          <mesh position={[0, nativeSize.y / 2, 0]} renderOrder={10}>
          <boxGeometry args={[
            nativeSize.x,
            nativeSize.y,
            nativeSize.z,
          ]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          <Edges color="#0878bd" threshold={12} lineWidth={1.5} />
        </mesh>
        ) : null}
    </group>
  );
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
          selected={selected}
          renderMode={renderMode}
          renderQuality={renderQuality}
        />
      </Suspense>
    </GlbLoadErrorBoundary>
  );
}
