import { useGLTF } from "@react-three/drei";
import { createPortal, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Suspense, useLayoutEffect, useMemo, useState } from "react";
import { Box3, BoxHelper, Group, Vector3 } from "three";
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
import { useModelViewPreviewQuality } from "../../rendering/ModelViewPreviewProfile";
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
  onReady?: () => void;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
};

/** Draw in canvas-world space so the outline follows any imported GLB pivot. */
function WorldBoundsOutline({ target }: { target: Group }) {
  const canvasScene = useThree((state) => state.scene);
  const helper = useMemo(() => new BoxHelper(target, "#0878bd"), [target]);

  useLayoutEffect(() => {
    helper.renderOrder = 10;
    helper.material.depthTest = false;
    return () => {
      helper.geometry.dispose();
      helper.material.dispose();
    };
  }, [helper]);
  useFrame(() => helper.update());

  return createPortal(<primitive object={helper} />, canvasScene);
}

function GlbSceneContent({
  url,
  definition,
  binding,
  materials,
  selected,
  renderMode,
  renderQuality,
  onReady,
  onPointerDown,
}: Omit<AssetBackedObjectProps, "primitives">) {
  const modelViewQuality = useModelViewPreviewQuality();
  const gltf = useGLTF(url);
  const invalidate = useThree((state) => state.invalidate);
  const castShadow = renderMode === "hero";
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const target = binding.targetSizeMm;
  const [scale, setScale] = useState(() =>
    target
      ? computeGlbScaleFactors(target, nativeSizeMmToMeters(definition.nativeSizeMm))
      : { x: 1, y: 1, z: 1 },
  );
  const [modelRoot, setModelRoot] = useState<Group | null>(null);

  const slotKey = JSON.stringify(binding.materialBindings);
  const groupsKey = JSON.stringify(definition.materialGroups);

  useLayoutEffect(() => {
    const bounds = new Box3().setFromObject(scene);
    const center = bounds.getCenter(new Vector3());
    scene.position.set(-center.x, -bounds.min.y, -center.z);
    scene.traverse((child) => {
      if (child instanceof Group) return;
      child.frustumCulled = false;
    });
    scene.updateMatrixWorld(true);
    const size = bounds.getSize(new Vector3());
    if (target) setScale(computeGlbScaleFactors(target, size));
  }, [scene, target?.depthMm, target?.heightMm, target?.widthMm]);

  useLayoutEffect(() => {
    if (!modelRoot) return;
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      modelRoot.updateMatrixWorld(true);
      invalidate();
      secondFrame = requestAnimationFrame(() => {
        modelRoot.updateMatrixWorld(true);
        invalidate();
        onReady?.();
      });
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, [invalidate, modelRoot, scale.x, scale.y, scale.z]);

  useLayoutEffect(() => {
    applyGlbSlotMaterials(scene, {
      materialGroups: definition.materialGroups,
      materialBindings: binding.materialBindings,
      materials,
      renderMode,
      renderQuality,
      modelViewQuality,
      castShadow,
      receiveShadow: true,
      importedTextures: binding.modelTextureUrls,
    });
  }, [
    castShadow,
    groupsKey,
    materials,
    modelViewQuality,
    renderMode,
    renderQuality,
    scene,
    slotKey,
    binding.modelTextureUrls,
  ]);

  return (
    <>
      <group
        ref={setModelRoot}
        scale={[scale.x, scale.y, scale.z]}
        onPointerDown={onPointerDown}
      >
        <primitive object={scene} />
      </group>
      {selected && modelRoot ? <WorldBoundsOutline target={modelRoot} /> : null}
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
          onReady={onReady}
          onPointerDown={onPointerDown}
        />
      </Suspense>
    </GlbLoadErrorBoundary>
  );
}
