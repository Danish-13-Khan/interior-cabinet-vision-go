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

  const slotKey = JSON.stringify(binding.materialBindings);
  const groupsKey = JSON.stringify(definition.materialGroups);

  useLayoutEffect(() => {
    const bounds = new Box3().setFromObject(scene);
    const center = bounds.getCenter(new Vector3());
    scene.position.set(-center.x, -bounds.min.y, -center.z);
  }, [scene]);

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

  const outlineSize = target ?? definition.nativeSizeMm;
  return (
    <>
      {/* Scaling the parent preserves the floor-centre pivot after normalizing GLB geometry. */}
      <group scale={[scale.x, scale.y, scale.z]}>
        <primitive object={scene} />
      </group>
      {selected ? (
        <mesh position={[0, outlineSize.heightMm / 2000, 0]} renderOrder={10}>
          <boxGeometry args={[
            outlineSize.widthMm / 1000,
            outlineSize.heightMm / 1000,
            outlineSize.depthMm / 1000,
          ]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          <Edges color="#0878bd" threshold={12} lineWidth={1.5} />
        </mesh>
      ) : null}
    </>
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
